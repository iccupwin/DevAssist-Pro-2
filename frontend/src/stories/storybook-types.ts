// Mock types for Storybook development
// These will be replaced when Storybook is properly installed

export type Meta<T = {}> = {
  title: string;
  component?: any;
  parameters?: any;
  argTypes?: any;
  args?: any;
};

export type StoryObj<T = {}> = {
  args?: any;
  parameters?: any;
  render?: () => JSX.Element;
  decorators?: any[];
};

// Mock action function for development
export const action = (name: string) => {
  return (...args: any[]) => {
    console.log(`Action: ${name}`, args);
  };
};