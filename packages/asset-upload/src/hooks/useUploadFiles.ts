import { useMutation } from '@apollo/client';
import { useRecoilValue } from 'recoil';

import { selectedTagIdState } from '@media-ui/feature-asset-tags';
import { selectedAssetCollectionIdState } from '@media-ui/feature-asset-collections';
import { selectedAssetSourceState } from '@media-ui/feature-asset-sources';

import { UPLOAD_FILES } from '../mutations';

interface UploadPropertiesInput {
    filename: string;
    title?: string;
    caption?: string;
    copyrightNotice?: string;
}

const extractUploadProperties = (files: UploadedFile[]): UploadPropertiesInput[] =>
    files
        .map((file) => ({
            filename: file.name,
            title: file.title || undefined,
            caption: file.caption || undefined,
            copyrightNotice: file.copyrightNotice || undefined,
        }))
        .filter(
            ({ title, caption, copyrightNotice }) =>
                title !== undefined || caption !== undefined || copyrightNotice !== undefined
        );

export default function useUploadFiles() {
    const [action, { error, data, loading }] = useMutation<{ uploadFiles: FileUploadResult[] }>(UPLOAD_FILES);
    const tagId = useRecoilValue(selectedTagIdState);
    const assetCollectionId = useRecoilValue(selectedAssetCollectionIdState);
    const assetSourceId = useRecoilValue(selectedAssetSourceState);

    const uploadFiles = (files: UploadedFile[]) => {
        const uploadProperties = extractUploadProperties(files);
        return action({
            variables: {
                files,
                assetSourceId,
                tagId,
                assetCollectionId,
                uploadProperties: uploadProperties.length > 0 ? uploadProperties : null,
            },
            refetchQueries: ['ASSET_COLLECTIONS'],
        });
    };

    return { uploadFiles, uploadState: data?.uploadFiles || [], error, loading };
}
