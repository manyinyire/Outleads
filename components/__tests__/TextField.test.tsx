import React from 'react';
import { render, screen } from '@testing-library/react';
import { Form } from 'antd';
import TextField from '@/components/admin/form-fields/TextField';
import { CrudField } from '@/components/admin/shared/CrudTable';

// Mock Ant Design's Form component for testing context
const MockForm = ({ children }: { children: React.ReactNode }) => {
  const [form] = Form.useForm();
  return <Form form={form}>{children}</Form>;
};

describe('TextField Component', () => {
  const baseField: CrudField = {
    name: 'testField',
    label: 'Test Field',
    type: 'text',
    required: true,
  };

  it('renders the label and input field correctly', () => {
    render(
      <MockForm>
        <TextField field={baseField} />
      </MockForm>
    );

    // Check if the label is rendered
    expect(screen.getByText('Test Field')).toBeInTheDocument();

    // Check if the input is rendered with the correct placeholder
    const inputElement = screen.getByPlaceholderText('Enter Test Field');
    expect(inputElement).toBeInTheDocument();
  });

  it('renders a password input when type is "password"', () => {
    const passwordField: CrudField = { ...baseField, type: 'password' };
    render(
      <MockForm>
        <TextField field={passwordField} />
      </MockForm>
    );

    // Ant Design password fields have a specific class or structure
    // We can check for the input's type attribute
    const inputElement = screen.getByPlaceholderText('Enter Test Field');
    expect(inputElement).toHaveAttribute('type', 'password');
  });

  it('disables the input when the disabled prop is true', () => {
    render(
      <MockForm>
        <TextField field={baseField} disabled={true} />
      </MockForm>
    );

    const inputElement = screen.getByPlaceholderText('Enter Test Field');
    expect(inputElement).toBeDisabled();
  });
});
