import { useMutation } from '@apollo/client';

import { REPLACE_ASSET } from '../mutations';

export interface AssetReplacementOptions {
    generateRedirects: boolean;
    keepOriginalFilename: boolean;
}

export interface AssetReplacementProperties {
    title?: string;
    caption?: string;
    copyrightNotice?: string;
}

interface ReplaceAssetProps {
    asset: Asset;
    file: File;
    options: AssetReplacementOptions;
    properties?: AssetReplacementProperties;
}

export default function useReplaceAsset() {
    const [action, { error, data, loading }] = useMutation<{ replaceAsset: FileUploadResult }>(REPLACE_ASSET);

    const replaceAsset = ({ asset, file, options, properties }: ReplaceAssetProps) => {
        const hasProperties = !!(properties?.title || properties?.caption || properties?.copyrightNotice);
        return action({
            variables: {
                id: asset.id,
                assetSourceId: asset.assetSource.id,
                file,
                options,
                uploadProperties: hasProperties
                    ? {
                          filename: file.name,
                          title: properties?.title || undefined,
                          caption: properties?.caption || undefined,
                          copyrightNotice: properties?.copyrightNotice || undefined,
                      }
                    : null,
            },
        });
    };

    return { replaceAsset, uploadState: data?.replaceAsset || null, error, loading };
}
