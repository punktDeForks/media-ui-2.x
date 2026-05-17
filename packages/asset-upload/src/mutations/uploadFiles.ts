import { gql } from '@apollo/client';

const UPLOAD_FILES = gql`
    mutation UploadFiles(
        $files: [UploadedFileInput!]!
        $assetSourceId: AssetSourceId!
        $tagId: TagId
        $assetCollectionId: AssetCollectionId
        $uploadProperties: [UploadPropertyInput!]
    ) {
        uploadFiles(
            files: $files
            assetSourceId: $assetSourceId
            tagId: $tagId
            assetCollectionId: $assetCollectionId
            uploadProperties: $uploadProperties
        ) {
            filename
            success
            result
            assetId
        }
    }
`;

export default UPLOAD_FILES;
