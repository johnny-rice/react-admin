import * as React from 'react';
import clsx from 'clsx';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import { useInput, FieldTitle } from 'ra-core';
import {
    ComponentsOverrides,
    styled,
    useThemeProps,
} from '@mui/material/styles';

import { CommonInputProps } from './CommonInputProps';
import { InputHelperText } from './InputHelperText';
import { sanitizeInputRestProps } from './sanitizeInputRestProps';

/**
 * An Input component for a number
 *
 * @example
 * <NumberInput source="nb_views" />
 *
 * You can customize the `step` props (which defaults to "any")
 * @example
 * <NumberInput source="nb_views" step={1} />
 *
 */
export const NumberInput = (props: NumberInputProps) => {
    const {
        className,
        defaultValue = null,
        format = convertNumberToString,
        helperText,
        label,
        margin,
        onChange,
        onBlur,
        onFocus,
        parse,
        resource,
        source,
        step = 'any',
        min,
        max,
        validate,
        variant,
        inputProps: overrideInputProps,
        disabled,
        readOnly,
        ...rest
    } = useThemeProps({
        props: props,
        name: PREFIX,
    });

    const {
        field,
        fieldState: { error, invalid },
        id,
        isRequired,
    } = useInput({
        defaultValue,
        onBlur,
        resource,
        source,
        validate,
        disabled,
        readOnly,
        ...rest,
    });
    const { onBlur: onBlurFromField } = field;

    const inputProps = { ...overrideInputProps, step, min, max };

    // This is a controlled input that renders directly the string typed by the user.
    // This string is converted to a number on change, and stored in the form state,
    // but that number is not not displayed.
    // This is to allow transitory values like '1.0' that will lead to '1.02'

    // text typed by the user and displayed in the input, unparsed
    const [value, setValue] = React.useState(format(field.value));

    const hasFocus = React.useRef(false);

    // update the input text when the record changes
    React.useEffect(() => {
        if (!hasFocus.current) {
            const stringValue = format(field.value);
            setValue(value => (value !== stringValue ? stringValue : value));
        }
    }, [field.value, format]);

    // update the input text when the user types in the input
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
            onChange(event);
        }
        if (
            typeof event.target === 'undefined' ||
            typeof event.target.value === 'undefined'
        ) {
            return;
        }
        const target = event.target;
        setValue(target.value);
        const newValue =
            target.valueAsNumber !== undefined &&
            target.valueAsNumber !== null &&
            !isNaN(target.valueAsNumber)
                ? parse
                    ? parse(target.valueAsNumber)
                    : target.valueAsNumber
                : parse
                  ? parse(target.value)
                  : convertStringToNumber(target.value);
        field.onChange(newValue);
    };

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
        if (onFocus) {
            onFocus(event);
        }
        hasFocus.current = true;
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
        if (onBlurFromField) {
            onBlurFromField(event);
        }
        hasFocus.current = false;
        const stringValue = format(field.value);
        setValue(value => (value !== stringValue ? stringValue : value));
    };

    const renderHelperText = helperText !== false || invalid;

    const { ref, ...fieldWithoutRef } = field;
    return (
        <StyledTextField
            id={id}
            {...fieldWithoutRef}
            inputRef={ref}
            // use the locally controlled state instead of the react-hook-form field state
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={clsx('ra-input', `ra-input-${source}`, className)}
            type="number"
            size="small"
            variant={variant}
            error={invalid}
            disabled={disabled || readOnly}
            readOnly={readOnly}
            helperText={
                renderHelperText ? (
                    <InputHelperText
                        error={error?.message}
                        helperText={helperText}
                    />
                ) : null
            }
            label={
                label !== '' && label !== false ? (
                    <FieldTitle
                        label={label}
                        source={source}
                        resource={resource}
                        isRequired={isRequired}
                    />
                ) : null
            }
            margin={margin}
            inputProps={{ ...inputProps, readOnly }}
            {...sanitizeInputRestProps(rest)}
        />
    );
};

export interface NumberInputProps
    extends CommonInputProps,
        Omit<
            TextFieldProps,
            | 'label'
            | 'helperText'
            | 'defaultValue'
            | 'onChange'
            | 'onBlur'
            | 'type'
        > {
    step?: string | number;
    min?: string | number;
    max?: string | number;
}

const convertStringToNumber = value => {
    if (value == null || value === '') {
        return null;
    }
    const float = parseFloat(value);

    return isNaN(float) ? 0 : float;
};

const convertNumberToString = value =>
    value == null || isNaN(value) ? '' : value.toString();

const PREFIX = 'RaNumberInput';

const StyledTextField = styled(TextField, {
    name: PREFIX,
    overridesResolver: (props, styles) => styles.root,
})({});

declare module '@mui/material/styles' {
    interface ComponentNameToClassKey {
        [PREFIX]: 'root';
    }

    interface ComponentsPropsList {
        [PREFIX]: Partial<NumberInputProps>;
    }

    interface Components {
        [PREFIX]?: {
            defaultProps?: ComponentsPropsList[typeof PREFIX];
            styleOverrides?: ComponentsOverrides<
                Omit<Theme, 'components'>
            >[typeof PREFIX];
        };
    }
}
