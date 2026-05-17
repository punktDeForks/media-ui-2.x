import React from 'react';
import cx from 'classnames';

import classes from './Property.module.css';

interface PropertyProps {
    label: string;
    isCheckbox?: boolean;
    children: React.ReactNode;
}

const Property: React.FC<PropertyProps> = ({ label, isCheckbox = false, children }) => (
    <div className={cx(classes.property, isCheckbox && classes.propertyCheckbox)}>
        <label className={classes.label}>{label}</label>
        <div className={classes.value}>{children}</div>
    </div>
);

export default React.memo(Property);
