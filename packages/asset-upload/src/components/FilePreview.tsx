import React, { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react';
import cx from 'classnames';
import { SetterOrUpdater } from 'recoil';

import { CheckBox, Icon, TextArea, TextInput } from '@neos-project/react-ui-components';

import { useIntl } from '@media-ui/core';
import { Property } from '@media-ui/core/src/components';
import { useConfigQuery } from '@media-ui/core/src/hooks';

import classes from './FilePreview.module.css';

type FilesUploadStateWithFiles = { files: FilesUploadState };

interface FilePreviewProps {
    file: UploadedFile;
    loading?: boolean;
    fileState: FileUploadResult;
    dialogState?: FilesUploadStateWithFiles;
    setFiles?: Dispatch<SetStateAction<FilesUploadState>>;
    setUploadPossible?: SetterOrUpdater<boolean>;
}

type UploadProperty = string | boolean;

const filesAreUploadable = (
    files: UploadedFile[],
    loading: boolean,
    requirements: { title: boolean; caption: boolean; copyrightNotice: boolean }
): boolean => {
    if (loading || files.length === 0) {
        return false;
    }
    return files.every(
        (file) =>
            (!requirements.title || (!!file.title && file.title !== '')) &&
            (!requirements.caption || (!!file.caption && file.caption !== '')) &&
            (!requirements.copyrightNotice ||
                (!!file.copyrightNotice && file.copyrightNotice !== '') ||
                !!file.copyrightNoticeNotNeeded)
    );
};

const FilePreview: React.FC<FilePreviewProps> = ({
    file,
    loading = false,
    fileState,
    dialogState,
    setFiles,
    setUploadPossible,
}: FilePreviewProps) => {
    const { translate } = useIntl();
    const { config } = useConfigQuery();
    const [copyrightNotNeededChecked, setCopyrightNotNeededChecked] = useState<boolean>(
        !!file.copyrightNoticeNotNeeded
    );

    const success = fileState?.success || dialogState?.files.finished.includes(file);
    const disabled = success || fileState?.result === 'EXISTS' || dialogState?.files.rejected.includes(file) || loading;
    const error = (fileState && !success) || dialogState?.files.rejected.includes(file);
    const result = fileState?.result || file.uploadStateResult;

    const showTitle = config.uploadPropertyShowTitle;
    const showCaption = config.uploadPropertyShowCaption;
    const showCopyrightNotice = config.uploadPropertyShowCopyrightNotice;
    const requireCopyrightNotice = config.uploadPropertyRequireCopyrightNotice;
    const isInteractive = !!dialogState && !!setFiles && !!setUploadPossible;
    const isWideThumb = isInteractive && (showTitle || showCaption || showCopyrightNotice);

    const requirements = useMemo(
        () => ({
            title: config.uploadPropertyRequireTitle,
            caption: config.uploadPropertyRequireCaption,
            copyrightNotice: requireCopyrightNotice,
        }),
        [config.uploadPropertyRequireTitle, config.uploadPropertyRequireCaption, requireCopyrightNotice]
    );

    const updateProperty = useCallback(
        (propertyName: 'title' | 'caption' | 'copyrightNotice' | 'copyrightNoticeNotNeeded', value: UploadProperty) => {
            if (!isInteractive) {
                return;
            }
            const updatedFiles = [...dialogState.files.selected];
            updatedFiles.forEach((selectedFile) => {
                if (selectedFile.name === file.name) {
                    (selectedFile as UploadedFile)[propertyName] = value as never;
                }
            });
            setFiles((prev) => ({ ...prev, selected: updatedFiles }));
            setUploadPossible(filesAreUploadable(updatedFiles, loading, requirements));
        },
        [isInteractive, dialogState, file.name, setFiles, setUploadPossible, loading, requirements]
    );

    const handleTitle = useCallback((value: string) => updateProperty('title', value), [updateProperty]);
    const handleCaption = useCallback((value: string) => updateProperty('caption', value), [updateProperty]);
    const handleCopyright = useCallback((value: string) => updateProperty('copyrightNotice', value), [updateProperty]);
    const handleCopyrightNotNeeded = useCallback(
        (checked: boolean) => {
            setCopyrightNotNeededChecked(checked);
            updateProperty('copyrightNoticeNotNeeded', checked);
        },
        [updateProperty]
    );

    return (
        <div className={classes.preview}>
            <div
                className={cx(
                    classes.thumb,
                    isWideThumb ? classes.thumbWide : '',
                    error ? classes.error : success ? classes.success : loading ? classes.loading : ''
                )}
                title={file.name}
            >
                <div className={classes.thumbInner}>
                    <img src={file.preview} alt={file.name} className={classes.img} />
                    {loading ? <Icon icon="spinner" spin={true} /> : null}
                    {success ? <Icon icon="check" /> : null}
                    {error ? <Icon icon="exclamation-circle" /> : null}
                    {result ? <span>{translate(`uploadDialog.fileList.${result.toLowerCase()}`, result)}</span> : null}
                </div>
            </div>
            {isInteractive && (showTitle || showCaption || showCopyrightNotice) ? (
                <div className={classes.properties}>
                    {showTitle ? (
                        <Property label={translate('inspector.title', 'Title')}>
                            <TextInput
                                className={classes.textInput}
                                disabled={disabled}
                                value={file.title || ''}
                                onChange={handleTitle}
                            />
                        </Property>
                    ) : null}
                    {showCaption ? (
                        <Property label={translate('inspector.caption', 'Caption')}>
                            <TextArea
                                className={classes.textArea}
                                disabled={disabled}
                                minRows={2}
                                expandedRows={4}
                                value={file.caption || ''}
                                onChange={handleCaption}
                            />
                        </Property>
                    ) : null}
                    {showCopyrightNotice ? (
                        <>
                            <Property label={translate('inspector.copyrightNotice', 'Copyright notice')}>
                                <TextArea
                                    className={classes.textArea}
                                    disabled={disabled || copyrightNotNeededChecked}
                                    minRows={2}
                                    expandedRows={4}
                                    value={file.copyrightNotice || ''}
                                    onChange={handleCopyright}
                                />
                            </Property>
                            {requireCopyrightNotice ? (
                                <Property
                                    label={translate(
                                        'uploadDialog.copyrightNoticeNotNeeded',
                                        'Copyright notice not needed'
                                    )}
                                    isCheckbox
                                >
                                    <CheckBox
                                        onChange={handleCopyrightNotNeeded}
                                        disabled={disabled}
                                        isChecked={copyrightNotNeededChecked}
                                        className={classes.checkBox}
                                    />
                                </Property>
                            ) : null}
                        </>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
};

export default React.memo(FilePreview);
