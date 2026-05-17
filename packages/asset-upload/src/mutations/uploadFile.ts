import { gql } from '@apollo/client';

const UPLOAD_FILE = gql`
    mutation UploadFile(
        $file: UploadedFileInput!
        $assetSourceId: AssetSourceId!
        $tagId: TagId
        $assetCollectionId: AssetCollectionId
        $uploadProperties: UploadPropertyInput
    ) {
        uploadFile(
            file: $file
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

export default UPLOAD_FILE;
