import * as React from 'react';
import {
    type ComponentsOverrides,
    styled,
    useThemeProps,
} from '@mui/material/styles';
import { useCallback, useRef, type ChangeEvent } from 'react';
import clsx from 'clsx';
import {
    Select,
    type SelectProps,
    MenuItem,
    InputLabel,
    FormHelperText,
    FormControl,
    type FormControlProps,
    Chip,
    OutlinedInput,
} from '@mui/material';
import {
    type ChoicesProps,
    FieldTitle,
    useInput,
    useChoicesContext,
    useChoices,
    type RaRecord,
    useGetRecordRepresentation,
} from 'ra-core';
import { InputHelperText } from './InputHelperText';

import { LinearProgress } from '../layout';
import type { CommonInputProps } from './CommonInputProps';
import { Labeled } from '../Labeled';
import {
    type SupportCreateSuggestionOptions,
    useSupportCreateSuggestion,
} from './useSupportCreateSuggestion';

/**
 * An Input component for a select box allowing multiple selections, using an array of objects for the options
 *
 * Pass possible options as an array of objects in the 'choices' attribute.
 *
 * By default, the options are built from:
 *  - the 'id' property as the option value,
 *  - the 'name' property as the option text
 * @example
 * const choices = [
 *    { id: 'programming', name: 'Programming' },
 *    { id: 'lifestyle', name: 'Lifestyle' },
 *    { id: 'photography', name: 'Photography' },
 * ];
 * <SelectArrayInput source="tags" choices={choices} />
 *
 * You can also customize the properties to use for the option name and value,
 * thanks to the 'optionText' and 'optionValue' attributes.
 * @example
 * const choices = [
 *    { _id: 123, full_name: 'Leo Tolstoi', sex: 'M' },
 *    { _id: 456, full_name: 'Jane Austen', sex: 'F' },
 * ];
 * <SelectArrayInput source="authors" choices={choices} optionText="full_name" optionValue="_id" />
 *
 * `optionText` also accepts a function, so you can shape the option text at will:
 * @example
 * const choices = [
 *    { id: 123, first_name: 'Leo', last_name: 'Tolstoi' },
 *    { id: 456, first_name: 'Jane', last_name: 'Austen' },
 * ];
 * const optionRenderer = choice => `${choice.first_name} ${choice.last_name}`;
 * <SelectArrayInput source="authors" choices={choices} optionText={optionRenderer} />
 *
 * `optionText` also accepts a React Element, that can access
 * the related choice through the `useRecordContext` hook. You can use Field components there.
 * @example
 * const choices = [
 *    { id: 123, first_name: 'Leo', last_name: 'Tolstoi' },
 *    { id: 456, first_name: 'Jane', last_name: 'Austen' },
 * ];
 * const FullNameField = () => {
 *     const record = useRecordContext();
 *     return (<span>{record.first_name} {record.last_name}</span>)
 * };
 * <SelectArrayInput source="authors" choices={choices} optionText={<FullNameField />}/>
 *
 * The choices are translated by default, so you can use translation identifiers as choices:
 * @example
 * const choices = [
 *    { id: 'programming', name: 'myroot.tags.programming' },
 *    { id: 'lifestyle', name: 'myroot.tags.lifestyle' },
 *    { id: 'photography', name: 'myroot.tags.photography' },
 * ];
 */
export const SelectArrayInput = (inProps: SelectArrayInputProps) => {
    const props = useThemeProps({
        props: inProps,
        name: PREFIX,
    });
    const {
        choices: choicesProp,
        className,
        create,
        createLabel,
        createValue,
        disableValue = 'disabled',
        format,
        helperText,
        label,
        isFetching: isFetchingProp,
        isLoading: isLoadingProp,
        isPending: isPendingProp,
        margin,
        onBlur,
        onChange,
        onCreate,
        options = defaultOptions,
        optionText,
        optionValue = 'id',
        parse,
        resource: resourceProp,
        size = 'small',
        source: sourceProp,
        translateChoice,
        validate,
        variant,
        disabled,
        readOnly,
        ...rest
    } = props;

    const inputLabel = useRef(null);

    const {
        allChoices,
        isPending,
        error: fetchError,
        source,
        resource,
        isFromReference,
    } = useChoicesContext({
        choices: choicesProp,
        isLoading: isLoadingProp,
        isPending: isPendingProp,
        isFetching: isFetchingProp,
        resource: resourceProp,
        source: sourceProp,
    });

    const {
        field,
        isRequired,
        fieldState: { error, invalid },
        id,
    } = useInput({
        format,
        onBlur,
        onChange,
        parse,
        resource,
        source,
        validate,
        disabled,
        readOnly,
        ...rest,
    });

    const getRecordRepresentation = useGetRecordRepresentation(resource);

    const { getChoiceText, getChoiceValue, getDisableValue } = useChoices({
        optionText:
            optionText ??
            (isFromReference ? getRecordRepresentation : undefined),
        optionValue,
        disableValue,
        translateChoice: translateChoice ?? !isFromReference,
    });

    const handleChange = useCallback(
        (eventOrChoice: ChangeEvent<HTMLInputElement> | RaRecord) => {
            // We might receive an event from the mui component
            // In this case, it will be the choice id
            if (eventOrChoice?.target) {
                // when used with different IDs types, unselection leads to double selection with both types
                // instead of the value being removed from the array
                // e.g. we receive eventOrChoice.target.value = [1, '2', 2] instead of [1] after removing 2
                // this snippet removes a value if it is present twice
                eventOrChoice.target.value = eventOrChoice.target.value.reduce(
                    (acc, value) => {
                        // eslint-disable-next-line eqeqeq
                        const index = acc.findIndex(v => v == value);
                        return index < 0
                            ? [...acc, value]
                            : [...acc.slice(0, index), ...acc.slice(index + 1)];
                    },
                    []
                );
                field.onChange(eventOrChoice);
            } else {
                // Or we might receive a choice directly, for instance a newly created one
                field.onChange([
                    ...(field.value || []),
                    getChoiceValue(eventOrChoice),
                ]);
            }
        },
        [field, getChoiceValue]
    );

    const {
        getCreateItem,
        handleChange: handleChangeWithCreateSupport,
        createElement,
    } = useSupportCreateSuggestion({
        create,
        createLabel,
        createValue,
        handleChange,
        onCreate,
        optionText,
    });

    const createItem = create || onCreate ? getCreateItem() : null;
    const finalChoices =
        create || onCreate
            ? [...(allChoices || []), createItem]
            : allChoices || [];

    const renderMenuItemOption = useCallback(
        choice =>
            !!createItem &&
            choice?.id === createItem.id &&
            typeof optionText === 'function'
                ? createItem.name
                : getChoiceText(choice),
        [createItem, getChoiceText, optionText]
    );

    const renderMenuItem = useCallback(
        choice => {
            return choice ? (
                <MenuItem
                    key={getChoiceValue(choice)}
                    value={getChoiceValue(choice)}
                    disabled={getDisableValue(choice)}
                >
                    {renderMenuItemOption(
                        !!createItem && choice?.id === createItem.id
                            ? createItem
                            : choice
                    )}
                </MenuItem>
            ) : null;
        },
        [getChoiceValue, getDisableValue, renderMenuItemOption, createItem]
    );

    if (isPending) {
        return (
            <Labeled
                label={label}
                source={source}
                resource={resource}
                className={clsx('ra-input', `ra-input-${source}`, className)}
                isRequired={isRequired}
            >
                <LinearProgress />
            </Labeled>
        );
    }

    // Here wen ensure we always have an array and this array does not contain the default value (empty string)
    const finalValue = Array.isArray(field.value ?? [])
        ? field.value
        : field.value
          ? [field.value]
          : [];

    const outlinedInputProps =
        variant === 'outlined'
            ? {
                  input: (
                      <OutlinedInput
                          id="select-multiple-chip"
                          label={
                              <FieldTitle
                                  label={label}
                                  source={source}
                                  resource={resource}
                                  isRequired={isRequired}
                              />
                          }
                      />
                  ),
              }
            : {};
    const renderHelperText = !!fetchError || helperText !== false || invalid;

    return (
        <>
            <StyledFormControl
                margin={margin}
                className={clsx('ra-input', `ra-input-${source}`, className)}
                error={fetchError || invalid}
                variant={variant}
                {...sanitizeRestProps(rest)}
            >
                <InputLabel
                    ref={inputLabel}
                    id={`${id}-outlined-label`}
                    htmlFor={id}
                >
                    <FieldTitle
                        label={label}
                        source={source}
                        resource={resource}
                        isRequired={isRequired}
                    />
                </InputLabel>
                <Select
                    id={id}
                    labelId={`${id}-outlined-label`}
                    label={
                        <FieldTitle
                            label={label}
                            source={source}
                            resource={resource}
                            isRequired={isRequired}
                        />
                    }
                    multiple
                    error={!!fetchError || invalid}
                    renderValue={(selected: any[]) => (
                        <div className={SelectArrayInputClasses.chips}>
                            {(Array.isArray(selected) ? selected : [])
                                .map(item =>
                                    (allChoices || []).find(
                                        // eslint-disable-next-line eqeqeq
                                        choice => getChoiceValue(choice) == item
                                    )
                                )
                                .filter(item => !!item)
                                .map(item => (
                                    <Chip
                                        key={getChoiceValue(item)}
                                        label={renderMenuItemOption(item)}
                                        className={SelectArrayInputClasses.chip}
                                        size="small"
                                    />
                                ))}
                        </div>
                    )}
                    disabled={disabled || readOnly}
                    readOnly={readOnly}
                    data-testid="selectArray"
                    size={size}
                    {...field}
                    {...options}
                    onChange={handleChangeWithCreateSupport}
                    value={finalValue}
                    {...outlinedInputProps}
                >
                    {finalChoices.map(renderMenuItem)}
                </Select>
                {renderHelperText ? (
                    <FormHelperText error={!!fetchError || !!error}>
                        <InputHelperText
                            error={error?.message || fetchError?.message}
                            helperText={helperText}
                        />
                    </FormHelperText>
                ) : null}
            </StyledFormControl>
            {createElement}
        </>
    );
};

export type SelectArrayInputProps = ChoicesProps &
    Omit<SupportCreateSuggestionOptions, 'handleChange'> &
    Omit<CommonInputProps, 'source'> &
    Omit<FormControlProps, 'defaultValue' | 'onBlur' | 'onChange'> & {
        options?: SelectProps;
        source?: string;
        onChange?: (event: ChangeEvent<HTMLInputElement> | RaRecord) => void;
    };

const sanitizeRestProps = ({
    alwaysOn,
    choices,
    defaultValue,
    disableValue,
    emptyText,
    enableGetChoices,
    filter,
    filterToQuery,
    initializeForm,
    initialValue,
    input,
    isRequired,
    label,
    limitChoicesToValue,
    loaded,
    locale,
    meta,
    onChange,
    options,
    optionValue,
    optionText,
    perPage,
    record,
    reference,
    resource,
    setFilter,
    setPagination,
    setSort,
    sort,
    source,
    textAlign,
    translate,
    translateChoice,
    validation,
    ...rest
}: any) => rest;

const PREFIX = 'RaSelectArrayInput';

export const SelectArrayInputClasses = {
    chips: `${PREFIX}-chips`,
    chip: `${PREFIX}-chip`,
};

const StyledFormControl = styled(FormControl, {
    name: PREFIX,
    overridesResolver: (props, styles) => styles.root,
})(({ theme }) => ({
    minWidth: theme.spacing(20),
    [theme.breakpoints.down('sm')]: {
        width: '100%',
    },
    [`& .${SelectArrayInputClasses.chips}`]: {
        display: 'flex',
        flexWrap: 'wrap',
    },

    [`& .${SelectArrayInputClasses.chip}`]: {
        marginTop: theme.spacing(0.5),
        marginRight: theme.spacing(0.5),
    },
}));

const defaultOptions = {};

declare module '@mui/material/styles' {
    interface ComponentNameToClassKey {
        RaSelectArrayInput: 'root' | 'chips' | 'chip';
    }

    interface ComponentsPropsList {
        RaSelectArrayInput: Partial<SelectArrayInputProps>;
    }

    interface Components {
        RaSelectArrayInput?: {
            defaultProps?: ComponentsPropsList['RaSelectArrayInput'];
            styleOverrides?: ComponentsOverrides<
                Omit<Theme, 'components'>
            >['RaSelectArrayInput'];
        };
    }
}
