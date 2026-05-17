import React, { Dispatch, SetStateAction } from 'react';
import { SetterOrUpdater } from 'recoil';

import { useIntl } from '@media-ui/core';

import FilePreview from './FilePreview';

import classes from './PreviewSection.module.css';

type FilesUploadStateWithFiles = { files: FilesUploadState };

interface PreviewSectionProps {
    files: FilesUploadState;
    loading: boolean;
    uploadState: FileUploadResult[];
    dialogState?: FilesUploadStateWithFiles;
    setFiles?: Dispatch<SetStateAction<FilesUploadState>>;
    setUploadPossible?: SetterOrUpdater<boolean>;
}

const PreviewSection: React.FC<PreviewSectionProps> = ({
    files,
    loading,
    uploadState,
    dialogState,
    setFiles,
    setUploadPossible,
}: PreviewSectionProps) => {
    const { translate } = useIntl();

    // FIXME: Mapping the uploadState to the files name is not the best solution as the same filename might be used multiple times

    return (
        <aside className={classes.fileList}>
            {files.selected.length > 0 ? (
                <>
                    <h4 className={classes.fileListHeader}>
                        {translate('uploadDialog.fileList.header', 'Selected files')}
                    </h4>
                    {files.selected.map((file) => (
                        <FilePreview
                            file={file}
                            loading={loading}
                            fileState={uploadState.find((result) => result.filename === file.name)}
                            key={file.id}
                            dialogState={dialogState}
                            setFiles={setFiles}
                            setUploadPossible={setUploadPossible}
                        />
                    ))}
                </>
            ) : null}
            {files.rejected.length > 0 ? (
                <>
                    <h4 className={classes.fileListHeader}>
                        {translate('uploadDialog.fileList.failedUploadsHeader', 'Failed uploads')}
                    </h4>
                    {files.rejected.map((file) => (
                        <FilePreview
                            file={file}
                            fileState={uploadState.find((result) => result.filename === file.name)}
                            key={file.id}
                            dialogState={dialogState}
                            setFiles={setFiles}
                            setUploadPossible={setUploadPossible}
                        />
                    ))}
                </>
            ) : null}
            {files.finished.length > 0 ? (
                <>
                    <h4 className={classes.fileListHeader}>
                        {translate('uploadDialog.fileList.successfulUploadsHeader', 'Successful uploads')}
                    </h4>
                    {files.finished.map((file) => (
                        <FilePreview
                            file={file}
                            fileState={uploadState.find((result) => result.filename === file.name)}
                            key={file.id}
                            dialogState={dialogState}
                            setFiles={setFiles}
                            setUploadPossible={setUploadPossible}
                        />
                    ))}
                </>
            ) : null}
        </aside>
    );
};

export default React.memo(PreviewSection);
