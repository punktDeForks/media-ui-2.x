<?php

declare(strict_types=1);

namespace Flowpack\Media\Ui\GraphQL\Types;

use Neos\Flow\Annotations as Flow;
use Wwwision\Types\Attributes\Description;

#[Description('Configuration object containing helpful parameters for API interaction')]
#[Flow\Proxy(false)]
final class Config
{
    private function __construct(
        #[Description('The lowest configured maximum upload file size')]
        public readonly FileSize $uploadMaxFileSize,
        #[Description('The maximum number of files that can be uploaded')]
        public readonly int $uploadMaxFileUploadLimit,
        public readonly DateTime $currentServerTime,
        public readonly bool $canManageTags,
        public readonly bool $canManageAssetCollections,
        public readonly bool $canManageAssets,
        public readonly ?AssetCollectionId $defaultAssetCollectionId = null,
        #[Description('Whether the title field is shown in the upload dialog')]
        public readonly bool $uploadPropertyShowTitle = false,
        #[Description('Whether the title field is required in the upload dialog')]
        public readonly bool $uploadPropertyRequireTitle = false,
        #[Description('Whether the caption field is shown in the upload dialog')]
        public readonly bool $uploadPropertyShowCaption = false,
        #[Description('Whether the caption field is required in the upload dialog')]
        public readonly bool $uploadPropertyRequireCaption = false,
        #[Description('Whether the copyright notice field is shown in the upload dialog')]
        public readonly bool $uploadPropertyShowCopyrightNotice = true,
        #[Description('Whether the copyright notice field is required in the upload dialog')]
        public readonly bool $uploadPropertyRequireCopyrightNotice = false,
    ) {
    }
}
