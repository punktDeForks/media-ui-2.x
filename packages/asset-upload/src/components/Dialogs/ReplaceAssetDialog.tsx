import React, { useCallback, useEffect, useMemo } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import { Button, CheckBox, Label } from '@neos-project/react-ui-components';

import { useIntl, useMediaUi, useNotify } from '@media-ui/core';
import { useAssetsQuery, useConfigQuery, useSelectedAsset } from '@media-ui/core/src/hooks';
import { Dialog } from '@media-ui/core/src/components';
import { featureFlagsState } from '@media-ui/core/src/state';

import UploadSection from '../UploadSection';
import PreviewSection from '../PreviewSection';
import { useUploadDialogState } from '../../hooks';
import useReplaceAsset, { AssetReplacementOptions } from '../../hooks/useReplaceAsset';
import { uploadPossibleState } from '../../state';

import classes from './ReplaceAssetDialog.module.css';

const ReplaceAssetDialog: React.FC = () => {
    const { translate } = useIntl();
    const Notify = useNotify();
    const selectedAsset = useSelectedAsset();
    const { replaceAsset, uploadState, loading } = useReplaceAsset();
    const { refetch } = useAssetsQuery();
    const { config } = useConfigQuery();
    const {
        approvalAttainmentStrategy: { obtainApprovalToReplaceAsset },
    } = useMediaUi();
    const featureFlags = useRecoilValue(featureFlagsState);
    const { state: dialogState, closeDialog, setFiles } = useUploadDialogState();
    const [uploadPossible, setUploadPossible] = useRecoilState(uploadPossibleState);
    const [replacementOptions, setReplacementOptions] = React.useState<AssetReplacementOptions>({
        keepOriginalFilename: false,
        generateRedirects: false,
    });

    // Prefill upload-properties on the selected replacement file with existing asset values
    useEffect(() => {
        if (!selectedAsset || dialogState.files.selected.length === 0) {
            return;
        }
        const file = dialogState.files.selected[0];
        if (file.title === undefined && file.caption === undefined && file.copyrightNotice === undefined) {
            file.title = selectedAsset.label || '';
            file.caption = selectedAsset.caption || '';
            file.copyrightNotice = selectedAsset.copyrightNotice || '';
        }
    }, [selectedAsset, dialogState.files.selected]);

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

    const acceptedFileTypes = useMemo(() => {
        const completeMediaType = selectedAsset?.file.mediaType;
        const regex = /^(?<type>(?:[.!#%&'`^~$*+\-|\w]+))\//;
        const mainType = completeMediaType.match(regex)?.groups?.type;
        return mainType ? (`${mainType}/*` as MediaType) : '';
    }, [selectedAsset]);

    const handleUpload = useCallback(async () => {
        if (dialogState.files.selected.length === 0) {
            return;
        }
        const file = dialogState.files.selected[0];
        const hasApprovalToReplaceAsset = await obtainApprovalToReplaceAsset({
            asset: selectedAsset,
        });

        if (hasApprovalToReplaceAsset) {
            try {
                await replaceAsset({
                    asset: selectedAsset,
                    file,
                    options: replacementOptions,
                    properties: {
                        title: file.title,
                        caption: file.caption,
                        copyrightNotice: file.copyrightNoticeNotNeeded ? '' : file.copyrightNotice,
                    },
                });

                Notify.ok(translate('uploadDialog.replacementFinished', 'Replacement finished'));
                closeDialog();
                void refetch();
            } catch (error) {
                Notify.error(translate('assetReplacement.error', 'Replacement failed'), error);
            }
        }
    }, [
        replaceAsset,
        Notify,
        translate,
        dialogState,
        replacementOptions,
        refetch,
        selectedAsset,
        closeDialog,
        obtainApprovalToReplaceAsset,
    ]);

    const handleSetFiles = useCallback(
        (files: UploadedFile[]) => {
            setFiles((prev) => {
                return { ...prev, selected: files };
            });
        },
        [setFiles]
    );

    return (
        <Dialog
            isOpen={dialogState.visible}
            title={translate('uploadDialog.replaceAsset', 'Replace Asset')}
            onRequestClose={closeDialog}
            actions={[
                <Button key="cancel" style="neutral" hoverStyle="darken" onClick={closeDialog}>
                    {uploadState
                        ? translate('uploadDialog.close', 'Close')
                        : translate('uploadDialog.cancel', 'Cancel')}
                </Button>,
                <Button key="upload" style="success" hoverStyle="success" disabled={!canUpload} onClick={handleUpload}>
                    {translate('uploadDialog.replace', 'Replace')}
                </Button>,
            ]}
            style="wide"
        >
            <section className={classes.uploadArea}>
                <UploadSection
                    files={dialogState.files.selected}
                    loading={loading}
                    onSetFiles={handleSetFiles}
                    maxFiles={1}
                    acceptedFileTypes={acceptedFileTypes}
                />
                <section className={classes.optionSection}>
                    {featureFlags.createAssetRedirectsOption ? (
                        <div className={classes.option}>
                            <Label className={classes.label}>
                                <CheckBox
                                    isChecked={replacementOptions.generateRedirects}
                                    onChange={(generateRedirects) =>
                                        setReplacementOptions({ ...replacementOptions, generateRedirects })
                                    }
                                />
                                <span>{translate('uploadDialog.generateRedirects', 'Generate redirects')}</span>
                            </Label>
                        </div>
                    ) : null}
                    <div className={classes.option}>
                        <Label className={classes.label}>
                            <CheckBox
                                isChecked={replacementOptions.keepOriginalFilename}
                                onChange={(keepOriginalFilename) =>
                                    setReplacementOptions({ ...replacementOptions, keepOriginalFilename })
                                }
                            />
                            <span>{translate('uploadDialog.keepOriginalFilename', 'Keep original filename')}</span>
                        </Label>
                    </div>
                </section>
                <PreviewSection
                    files={dialogState.files}
                    loading={loading}
                    uploadState={uploadState ? [uploadState] : []}
                    dialogState={dialogState}
                    setFiles={setFiles}
                    setUploadPossible={setUploadPossible}
                />
            </section>
        </Dialog>
    );
};

export default React.memo(ReplaceAssetDialog);
