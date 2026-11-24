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

use Neos\Cache\Frontend\StringFrontend;
use TusPhp\Cache\Cacheable;

/**
 * Stores the state of TUS uploads in a Flow cache instead of the file based cache of tus-php.
 *
 * If several servers handle the chunks of an upload, configure a shared backend
 * (e.g. Neos\Cache\Backend\RedisBackend) for the cache "Flowpack_Media_Ui_TusUploadCache".
 */
final class FlowCacheStore implements Cacheable
{
    private string $prefix = '';

    public function __construct(
        private readonly StringFrontend $cache,
        private readonly int $ttl,
    ) {
    }

    public function get(string $key, bool $withExpired = false): ?array
    {
        $contents = $this->cache->get($this->cacheIdentifier($key));
        if (!is_string($contents)) {
            return null;
        }

        $contents = json_decode($contents, true);
        if (!is_array($contents) || $contents === []) {
            return null;
        }

        if ($withExpired) {
            return $contents;
        }

        return $this->isExpired($contents) ? null : $contents;
    }

    public function set(string $key, $value): bool
    {
        // Same behaviour as \TusPhp\Cache\FileStore: arrays are merged into existing contents
        $existingContents = $this->get($key, true);
        $contents = is_array($value) && $existingContents !== null ? $value + $existingContents : $value;

        $this->cache->set($this->cacheIdentifier($key), (string)json_encode($contents), [], $this->ttl);
        return true;
    }

    public function delete(string $key): bool
    {
        return $this->cache->remove($this->cacheIdentifier($key));
    }

    public function deleteAll(array $keys): bool
    {
        foreach ($keys as $key) {
            $this->delete($key);
        }
        return true;
    }

    public function getTtl(): int
    {
        return $this->ttl;
    }

    /**
     * Only used by \TusPhp\Tus\Server::handleExpiration() which is not supported, expired entries are removed by the cache lifetime
     */
    public function keys(): array
    {
        return [];
    }

    public function setPrefix(string $prefix): self
    {
        $this->prefix = $prefix;
        return $this;
    }

    public function getPrefix(): string
    {
        return $this->prefix;
    }

    /**
     * Flow cache identifiers must not contain the ":" used by tus-php in its prefix
     */
    private function cacheIdentifier(string $key): string
    {
        // Same as \TusPhp\Cache\AbstractCache::getActualCacheKey(), keys might be passed with or without prefix
        $prefixedKey = str_starts_with($key, $this->prefix) ? $key : $this->prefix . $key;
        return sha1($prefixedKey);
    }

    private function isExpired(array $contents): bool
    {
        $expiresAt = isset($contents['expires_at']) ? strtotime((string)$contents['expires_at']) : false;
        return $expiresAt !== false && $expiresAt < time();
    }
}
