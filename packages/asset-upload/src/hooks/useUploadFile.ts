import { useMutation } from '@apollo/client';
import { useRecoilValue } from 'recoil';

import { selectedTagIdState } from '@media-ui/feature-asset-tags';
import { selectedAssetCollectionIdState } from '@media-ui/feature-asset-collections';
import { selectedAssetSourceState } from '@media-ui/feature-asset-sources';

import { UPLOAD_FILE } from '../mutations';

export default function useUploadFile() {
    const [action, { error, data, loading }] = useMutation<{ uploadFile: FileUploadResult }>(UPLOAD_FILE);
    const tagId = useRecoilValue(selectedTagIdState);
    const assetCollectionId = useRecoilValue(selectedAssetCollectionIdState);
    const assetSourceId = useRecoilValue(selectedAssetSourceState);

    const uploadFile = (file: UploadedFile) => {
        const hasProperties = !!(file.title || file.caption || file.copyrightNotice);
        return action({
            variables: {
                file,
                assetSourceId,
                tagId,
                assetCollectionId,
                uploadProperties: hasProperties
                    ? {
                          filename: file.name,
                          title: file.title || undefined,
                          caption: file.caption || undefined,
                          copyrightNotice: file.copyrightNotice || undefined,
                      }
                    : null,
            },
            refetchQueries: ['ASSET_COLLECTIONS'],
        });
    };

    return { uploadFile, uploadState: data?.uploadFile || {}, error, loading };
}
