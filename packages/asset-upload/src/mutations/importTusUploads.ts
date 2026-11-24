import { gql } from '@apollo/client';

const IMPORT_TUS_UPLOADS = gql`
    mutation ImportTusUploads(
        $uploads: [TusUploadInput!]!
        $assetSourceId: AssetSourceId!
        $tagId: TagId
        $assetCollectionId: AssetCollectionId
        $uploadProperties: [UploadPropertyInput!]
    ) {
        importTusUploads(
            uploads: $uploads
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

export default IMPORT_TUS_UPLOADS;
