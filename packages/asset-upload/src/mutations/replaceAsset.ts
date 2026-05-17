import { gql } from '@apollo/client';

const REPLACE_ASSET = gql`
    mutation ReplaceAsset(
        $id: AssetId!
        $assetSourceId: AssetSourceId!
        $file: UploadedFileInput!
        $options: AssetReplacementOptionsInput!
        $uploadProperties: UploadPropertyInput
    ) {
        replaceAsset(
            id: $id
            assetSourceId: $assetSourceId
            file: $file
            options: $options
            uploadProperties: $uploadProperties
        ) {
            filename
            success
            result
        }
    }
`;

export default REPLACE_ASSET;
