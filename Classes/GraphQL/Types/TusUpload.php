<?php

declare(strict_types=1);

namespace Flowpack\Media\Ui\GraphQL\Types;

use Neos\Flow\Annotations as Flow;
use Wwwision\Types\Attributes\Description;

#[Description('A file which was uploaded completely via the TUS endpoint')]
#[Flow\Proxy(false)]
final class TusUpload
{
    private function __construct(
        #[Description('The id of the upload, the last segment of the upload URL returned by the TUS endpoint')]
        public readonly string $uploadId,
        #[Description('Original file name including extension (e.g. "some-file.pdf")')]
        public readonly string $filename,
    ) {
    }
}
