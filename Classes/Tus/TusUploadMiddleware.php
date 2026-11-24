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

use Flowpack\Media\Ui\Controller\MediaController;
use GuzzleHttp\Psr7\Response;
use Neos\Flow\Annotations as Flow;
use Neos\Flow\Mvc\ActionRequest;
use Neos\Flow\Security\Authentication\AuthenticationManagerInterface;
use Neos\Flow\Security\Authorization\PrivilegeManagerInterface;
use Neos\Flow\Security\Context as SecurityContext;
use Neos\Flow\Security\Exception\AuthenticationRequiredException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Endpoint for chunked file uploads via the TUS protocol, see TusUploadService
 */
#[Flow\Scope('singleton')]
class TusUploadMiddleware implements MiddlewareInterface
{
    #[Flow\Inject]
    protected TusUploadService $tusUploadService;

    #[Flow\Inject]
    protected SecurityContext $securityContext;

    #[Flow\Inject]
    protected AuthenticationManagerInterface $authenticationManager;

    #[Flow\Inject]
    protected PrivilegeManagerInterface $privilegeManager;

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $endpoint = $this->tusUploadService->getEndpoint();
        $path = $request->getUri()->getPath();
        if (!$this->tusUploadService->isEnabled() || ($path !== $endpoint && !str_starts_with($path, $endpoint . '/'))) {
            return $handler->handle($request);
        }

        // Authenticate the backend user like for the GraphQL endpoint by simulating a request to the module controller
        $actionRequest = ActionRequest::fromHttpRequest($request);
        $actionRequest->setControllerObjectName(MediaController::class);
        $this->securityContext->setRequest($actionRequest);
        try {
            $this->authenticationManager->authenticate();
        } catch (AuthenticationRequiredException) {
            return new Response(401);
        }

        if (!$this->privilegeManager->isPrivilegeTargetGranted('Flowpack.Media.Ui:ManageAssets')) {
            return new Response(403);
        }

        return $this->tusUploadService->handleRequest($request->getMethod());
    }
}
