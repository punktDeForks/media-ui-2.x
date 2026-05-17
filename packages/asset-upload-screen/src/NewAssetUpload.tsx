import * as React from 'react';
import { useCallback, useEffect } from 'react';
import cx from 'classnames';
import { useRecoilState } from 'recoil';

import { Button } from '@neos-project/react-ui-components';

import { useIntl, useNotify } from '@media-ui/core';
import theme from '@media-ui/core/src/Theme.module.css';
import { useConfigQuery } from '@media-ui/core/src/hooks';
import { useUploadDialogState, useUploadFiles } from '@media-ui/feature-asset-upload/src/hooks';
import { PreviewSection, UploadSection } from '@media-ui/feature-asset-upload/src/components';
import { uploadPossibleState } from '@media-ui/feature-asset-upload/src/state';

import classes from './NewAssetUpload.module.css';

interface NewAssetUploadProps {
    onComplete: (result: { object: { __identity: string } }) => void;
}

const NewAssetUpload: React.FC<NewAssetUploadProps> = ({ onComplete }) => {
    const { translate } = useIntl();
    const Notify = useNotify();
    const { uploadFiles, uploadState, loading } = useUploadFiles();
    const { state: dialogState, setFiles } = useUploadDialogState();
    const { config } = useConfigQuery();
    const [uploadPossible, setUploadPossible] = useRecoilState(uploadPossibleState);

    useEffect(() => {
        const noRequiredFields =
            !config.uploadPropertyRequireTitle &&
            !config.uploadPropertyRequireCaption &&
            !config.uploadPropertyRequireCopyrightNotice;
        if (noRequiredFields) {
            setUploadPossible(dialogState.files.selected.length > 0);
        }
    }, [
        dialogState.files.selected,
        config.uploadPropertyRequireTitle,
        config.uploadPropertyRequireCaption,
        config.uploadPropertyRequireCopyrightNotice,
        setUploadPossible,
    ]);

    const canUpload = uploadPossible && !loading && dialogState.files.selected.length > 0;

    const handleUpload = useCallback(() => {
        uploadFiles(dialogState.files.selected)
            .then(({ data }) => {
                const results = data?.uploadFiles ?? [];
                setFiles((prev) => ({
                    selected: [],
                    finished: [
                        ...prev.finished,
                        ...prev.selected.filter((file) =>
                            results.find((result) => {
                                if (result.success && result.filename === file.name) {
                                    file.uploadStateResult = result.result;
                                    return true;
                                }
                                return false;
                            })
                        ),
                    ],
                    rejected: [
                        ...prev.rejected,
                        ...prev.selected.filter((file) =>
                            results.find((result) => {
                                if (!result.success && result.filename === file.name) {
                                    file.uploadStateResult = result.result;
                                    return true;
                                }
                                return false;
                            })
                        ),
                    ],
                }));
                const firstResult = results[0];
                if (!firstResult || !firstResult.success) {
                    Notify.warning(
                        translate('uploadDialog.uploadFinishedWithErrors', 'Some files could not be uploaded')
                    );
                } else {
                    Notify.ok(translate('uploadDialog.uploadFinished', 'Upload finished'));
                    if (firstResult.assetId) {
                        onComplete({ object: { __identity: firstResult.assetId } });
                    }
                }
                setUploadPossible(false);
            })
            .catch((error) => {
                Notify.error(translate('fileUpload.error', 'Upload failed'), error);
            });
    }, [uploadFiles, dialogState.files.selected, setFiles, setUploadPossible, Notify, translate, onComplete]);

    const handleSetFiles = useCallback(
        (files: UploadedFile[]) => {
            setFiles((prev) => {
                const fileNames = new Set<string>();
                for (const file of prev.finished.concat(prev.rejected)) {
                    fileNames.add(file.name);
                }
                const newSelectedFiles = files.filter((file) => {
                    if (fileNames.has(file.name)) {
                        return false;
                    }
                    fileNames.add(file.name);
                    return true;
                });
                return { ...prev, selected: newSelectedFiles };
            });
        },
        [setFiles]
    );

    return (
        <section className={cx(classes.uploadArea, theme.mediaModuleTheme)}>
            <UploadSection
                files={dialogState.files.selected}
                loading={loading}
                onSetFiles={handleSetFiles}
                maxFiles={1}
            />
            <PreviewSection
                files={dialogState.files}
                loading={loading}
                uploadState={uploadState}
                dialogState={dialogState}
                setFiles={setFiles}
                setUploadPossible={setUploadPossible}
            />
            <div className={classes.controls}>
                <Button key="upload" style="success" hoverStyle="success" disabled={!canUpload} onClick={handleUpload}>
                    {translate('uploadDialog.upload', 'Upload')}
                </Button>
            </div>
        </section>
    );
};

export default NewAssetUpload;
