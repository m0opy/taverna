import {TextInput} from '@gravity-ui/uikit';
import type {ComponentProps, ReactNode} from 'react';

import './form-fields.css';

type FieldTone = 'light' | 'dark';

interface FieldFrameProps {
  children: ReactNode;
  hint?: ReactNode;
  label: string;
  tone?: FieldTone;
}

function FieldFrame({children, hint, label, tone = 'light'}: FieldFrameProps) {
  return (
    <label className={`form-field form-field--${tone}`}>
      <span className="form-field__label">{label}</span>
      {children}
      {hint && <span className="form-field__hint">{hint}</span>}
    </label>
  );
}

type GravityTextInputProps = ComponentProps<typeof TextInput>;

export interface TextFieldProps extends Omit<GravityTextInputProps, 'className' | 'label'> {
  hint?: ReactNode;
  label: string;
  tone?: FieldTone;
}

export function TextField({hint, label, size = 'xl', tone = 'light', ...inputProps}: TextFieldProps) {
  return (
    <FieldFrame hint={hint} label={label} tone={tone}>
      <TextInput {...inputProps} className="form-field__text-input" size={size} />
    </FieldFrame>
  );
}

type NativeTextAreaProps = ComponentProps<'textarea'>;

export interface TextAreaFieldProps extends Omit<NativeTextAreaProps, 'className'> {
  hint?: ReactNode;
  label: string;
  tone?: FieldTone;
}

export function TextAreaField({hint, label, tone = 'light', ...textareaProps}: TextAreaFieldProps) {
  return (
    <FieldFrame hint={hint} label={label} tone={tone}>
      <textarea {...textareaProps} className="form-field__textarea" />
    </FieldFrame>
  );
}
