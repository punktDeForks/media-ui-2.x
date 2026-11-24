<?php

declare(strict_types=1);

namespace Flowpack\Media\Ui\Tus;

/*
 * This file is part of the Flowpack.Media.Ui package.
 *
 * (c) Contributors of the Neos Project - www.neos.io
 *
 * This package is Open Source Software. For the full copyright and license
 * information, please view the LICENSE file which was distributed with this
 * source code.
 */

use GuzzleHttp\Psr7\Response;
use Neos\Flow\Annotations as Flow;
use Neos\Flow\Log\Utility\LogEnvironment;
use Neos\Flow\Security\Context as SecurityContext;
use Neos\Flow\Utility\Algorithms;
use Neos\Utility\Files;
use Psr\Http\Message\ResponseInterface;
use Psr\Log\LoggerInterface;
use TusPhp\Tus\Server;

/**
 * Receives files in chunks via the TUS protocol (https://tus.io), so files of any size can be uploaded
 * without being limited by the maximum request size and without loading them into memory.
 *
 * Each upload is stored in its own directory with a neutral file name. The original file name is sent
 * as metadata and used when the completed upload is imported as asset (see AssetMutator::importTusUploads()).
 */
#[Flow\Scope('singleton')]
class TusUploadService
{
    private const UPLOAD_FILENAME = 'upload';

    #[Flow\Inject]
    protected FlowCacheStore $cacheStore;

    #[Flow\Inject]
    protected SecurityContext $securityContext;

    #[Flow\Inject]
    protected LoggerInterface $logger;

    /**
     * @var array{enabled?: bool, endpoint?: string, chunkSize?: string, maximumFileSize?: string, uploadDirectory?: string, expirationTime?: int}
     */
    #[Flow\InjectConfiguration(path: 'upload.tus', package: 'Flowpack.Media.Ui')]
    protected array $settings = [];

    public function isEnabled(): bool
    {
        return (bool)($this->settings['enabled'] ?? false);
    }

    public function getEndpoint(): string
    {
        return rtrim((string)($this->settings['endpoint'] ?? '/neos/media-ui/tus'), '/');
    }

    public function getChunkSize(): int
    {
        return (int)Files::sizeStringToBytes((string)($this->settings['chunkSize'] ?? '50MB'));
    }

    public function getMaximumFileSize(): int
    {
        return (int)Files::sizeStringToBytes((string)($this->settings['maximumFileSize'] ?? '2GB'));
    }

    /**
     * Handles a TUS request (POST creates an upload, PATCH appends a chunk, HEAD returns the current offset)
     */
    public function handleRequest(string $method): ResponseInterface
    {
        $server = $this->createServer();

        if ($method === 'POST') {
            $this->removeExpiredUploads();
            $uploadId = Algorithms::generateUUID();
            $uploadDirectory = $this->getUploadDirectory($uploadId);
            Files::createDirectoryRecursively($uploadDirectory);
            $server->setUploadKey($uploadId)->setUploadDir($uploadDirectory);
        }

        $tusResponse = $server->serve();

        if ($method === 'POST' && $tusResponse->getStatusCode() === 201) {
            // Remember who started the upload, only this account may import it
            $this->cacheStore->set($server->getUploadKey(), ['account' => $this->getCurrentAccountIdentifier()]);
        }

        $headers = $tusResponse->headers->all();
        unset($headers['set-cookie']);
        if (isset($headers['location'])) {
            // tus-php builds an absolute URL, which might have the wrong scheme behind a proxy. The client resolves relative URLs.
            $headers['location'] = array_map(static fn(string $location) => (string)parse_url($location, PHP_URL_PATH), $headers['location']);
        }

        return new Response($tusResponse->getStatusCode(), $headers, (string)$tusResponse->getContent());
    }

    /**
     * Returns the path of a completely uploaded file, which was uploaded by the current account
     *
     * @return array{path: string, metadata: array<string, string>}|null
     */
    public function getCompletedUpload(string $uploadId): ?array
    {
        if (!preg_match('/^[a-f0-9-]{36}$/', $uploadId)) {
            return null;
        }

        $this->createServer(); // sets the cache prefix used by tus-php
        $upload = $this->cacheStore->get($uploadId);

        if ($upload === null
            || ($upload['account'] ?? null) !== $this->getCurrentAccountIdentifier()
            || (int)($upload['offset'] ?? -1) !== (int)($upload['size'] ?? -2)
            || !is_file((string)($upload['file_path'] ?? ''))
        ) {
            return null;
        }

        return [
            'path' => (string)$upload['file_path'],
            'metadata' => (array)($upload['metadata'] ?? []),
        ];
    }

    public function removeUpload(string $uploadId): void
    {
        if (!preg_match('/^[a-f0-9-]{36}$/', $uploadId)) {
            return;
        }

        $this->createServer(); // sets the cache prefix used by tus-php
        $this->cacheStore->delete($uploadId);
        if (is_dir($this->getUploadDirectory($uploadId))) {
            Files::removeDirectoryRecursively($this->getUploadDirectory($uploadId));
        }
    }

    private function createServer(): Server
    {
        $server = new Server($this->cacheStore);
        $server->setApiPath($this->getEndpoint());
        $server->setMaxUploadSize($this->getMaximumFileSize());
        $server->setUploadDir($this->getUploadDirectory());
        return $server;
    }

    private function getUploadDirectory(?string $uploadId = null): string
    {
        $baseDirectory = (string)($this->settings['uploadDirectory'] ?? FLOW_PATH_DATA . 'Temporary/MediaUiTusUploads');
        return $uploadId === null ? $baseDirectory : Files::concatenatePaths([$baseDirectory, $uploadId]);
    }

    /**
     * Abandoned uploads are removed after the expiration time
     */
    private function removeExpiredUploads(): void
    {
        $baseDirectory = $this->getUploadDirectory();
        if (!is_dir($baseDirectory)) {
            return;
        }

        $expiredBefore = time() - (int)($this->settings['expirationTime'] ?? 86400);
        foreach (new \DirectoryIterator($baseDirectory) as $directory) {
            if ($directory->isDot() || !$directory->isDir() || $directory->getMTime() >= $expiredBefore) {
                continue;
            }
            try {
                Files::removeDirectoryRecursively($directory->getPathname());
            } catch (\Exception $exception) {
                $this->logger->warning(sprintf('Could not remove expired TUS upload %s: %s', $directory->getPathname(), $exception->getMessage()), LogEnvironment::fromMethodName(__METHOD__));
            }
        }
    }

    private function getCurrentAccountIdentifier(): ?string
    {
        return $this->securityContext->getAccount()?->getAccountIdentifier();
    }
}
