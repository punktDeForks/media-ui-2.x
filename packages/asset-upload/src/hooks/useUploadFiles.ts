import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useRecoilValue } from 'recoil';
import { Upload } from 'tus-js-client';

import { useConfigQuery } from '@media-ui/core/src/hooks';
import { selectedTagIdState } from '@media-ui/feature-asset-tags';
import { selectedAssetCollectionIdState } from '@media-ui/feature-asset-collections';
import { selectedAssetSourceState } from '@media-ui/feature-asset-sources';

import { IMPORT_TUS_UPLOADS, UPLOAD_FILES } from '../mutations';

interface UploadPropertiesInput {
    filename: string;
    title?: string;
    caption?: string;
    copyrightNotice?: string;
}

interface TusUploadInput {
    uploadId: string;
    filename: string;
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

/**
 * Uploads the file in chunks to the TUS endpoint and resolves with the id of the upload.
 * Interrupted uploads of the same file are resumed.
 */
const uploadViaTus = (file: File, endpoint: string, chunkSize: number): Promise<TusUploadInput> =>
    new Promise((resolve, reject) => {
        const upload = new Upload(file, {
            endpoint,
            chunkSize,
            retryDelays: [0, 3000, 10000, 30000],
            // The server rejects file names with special characters, the original file name is passed on import
            metadata: { name: 'upload', filetype: file.type },
            removeFingerprintOnSuccess: true,
            onError: reject,
            onSuccess: () => resolve({ uploadId: upload.url.split('/').pop(), filename: file.name }),
        });
        upload
            .findPreviousUploads()
            .then((previousUploads) => {
                if (previousUploads.length > 0) {
                    upload.resumeFromPreviousUpload(previousUploads[0]);
                }
                upload.start();
            })
            .catch(reject);
    });

export default function useUploadFiles() {
    const { config } = useConfigQuery();
    const [action, { error, data, loading }] = useMutation<{ uploadFiles: FileUploadResult[] }>(UPLOAD_FILES);
    const [importAction, { error: importError, loading: importLoading }] = useMutation<{
        importTusUploads: FileUploadResult[];
    }>(IMPORT_TUS_UPLOADS);
    const [tusUploading, setTusUploading] = useState(false);
    const [tusUploadState, setTusUploadState] = useState<FileUploadResult[]>([]);
    const tagId = useRecoilValue(selectedTagIdState);
    const assetCollectionId = useRecoilValue(selectedAssetCollectionIdState);
    const assetSourceId = useRecoilValue(selectedAssetSourceState);

    const uploadFilesViaTus = async (files: UploadedFile[], uploadProperties: UploadPropertiesInput[]) => {
        setTusUploading(true);
        try {
            const uploads = await Promise.all(
                files.map((file) =>
                    uploadViaTus(file, config.tusUploadEndpoint, config.tusUploadChunkSize).catch((uploadError) => {
                        console.error(`Upload of ${file.name} failed`, uploadError);
                        return null;
                    })
                )
            );
            const completedUploads = uploads.filter((upload) => upload !== null);
            const failedResults: FileUploadResult[] = files
                .filter((_, index) => uploads[index] === null)
                .map((file) => ({ filename: file.name, success: false, result: 'ERROR' }));

            let importedResults: FileUploadResult[] = [];
            if (completedUploads.length > 0) {
                const result = await importAction({
                    variables: {
                        uploads: completedUploads,
                        assetSourceId,
                        tagId,
                        assetCollectionId,
                        uploadProperties: uploadProperties.length > 0 ? uploadProperties : null,
                    },
                    refetchQueries: ['ASSET_COLLECTIONS'],
                });
                importedResults = result.data.importTusUploads;
            }

            const results = [...importedResults, ...failedResults];
            setTusUploadState(results);
            // Same result structure as the uploadFiles mutation
            return { data: { uploadFiles: results } };
        } finally {
            setTusUploading(false);
        }
    };

    const uploadFiles = (files: UploadedFile[]) => {
        const uploadProperties = extractUploadProperties(files);
        if (config.tusUploadEnabled) {
            return uploadFilesViaTus(files, uploadProperties);
        }
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

    return {
        uploadFiles,
        uploadState: config.tusUploadEnabled ? tusUploadState : data?.uploadFiles || [],
        error: error || importError,
        loading: loading || importLoading || tusUploading,
    };
}
