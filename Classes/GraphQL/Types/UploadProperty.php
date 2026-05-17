<?php

declare(strict_types=1);

namespace Flowpack\Media\Ui\GraphQL\Types;

use Neos\Flow\Annotations as Flow;
use Wwwision\Types\Attributes\Description;

#[Description('Additional properties applied to an uploaded or replaced asset, keyed by file name')]
#[Flow\Proxy(false)]
final class UploadProperty
{
    private function __construct(
        #[Description('File name the properties belong to (must match the corresponding UploadedFile.clientFilename for multi-file uploads)')]
        public readonly string $filename,
        public readonly ?string $title = null,
        public readonly ?string $caption = null,
        public readonly ?string $copyrightNotice = null,
    ) {
    }
}
