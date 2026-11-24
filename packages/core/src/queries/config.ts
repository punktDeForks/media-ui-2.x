import { gql } from '@apollo/client';

const CONFIG = gql`
    query CONFIG {
        config {
            uploadMaxFileSize
            uploadMaxFileUploadLimit
            currentServerTime
            defaultAssetCollectionId
            canManageAssetCollections
            canManageTags
            canManageAssets
            uploadPropertyShowTitle
            uploadPropertyRequireTitle
            uploadPropertyShowCaption
            uploadPropertyRequireCaption
            uploadPropertyShowCopyrightNotice
            uploadPropertyRequireCopyrightNotice
            tusUploadEnabled
            tusUploadEndpoint
            tusUploadChunkSize
            tusUploadMaxFileSize
        }
    }
`;

export default CONFIG;
