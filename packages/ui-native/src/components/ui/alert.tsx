import React, { useMemo } from 'react';

import { View, ViewProps } from 'react-native';

import { cn } from '../../lib/utils';
import { Text } from './text';

interface AlertProps extends ViewProps {
  children: React.ReactNode;
}

type AlertTitleProps = React.ComponentProps<typeof Text>;
type AlertDescriptionProps = React.ComponentProps<typeof Text>;
type AlertIconProps = React.ComponentProps<typeof View>;
type AlertActionsProps = React.ComponentProps<typeof View>;

export function Alert({ children, className, ...props }: AlertProps) {
  const components = useMemo(
    () => React.Children.toArray(children),
    [children],
  );

  const Title = components.find(
    (child) => React.isValidElement(child) && child.type === AlertTitle,
  );

  const Description = components.find(
    (child) => React.isValidElement(child) && child.type === AlertDescription,
  );

  const Actions = components.find(
    (child) => React.isValidElement(child) && child.type === AlertActions,
  );

  const Icon = components.find(
    (child) => React.isValidElement(child) && child.type === AlertIcon,
  );

  return (
    <View
      className={cn(
        `border-border flex-col items-center justify-center gap-4 rounded-lg border p-8`,
        className,
      )}
      {...props}
    >
      {Icon}

      <View className={'flex-col items-center gap-1'}>
        {Title}
        {Description}
      </View>

      {Actions}
    </View>
  );
}

export function AlertTitle({ children, className, ...props }: AlertTitleProps) {
  return (
    <Text className={cn('text-center font-semibold', className)} {...props}>
      {children}
    </Text>
  );
}

export function AlertDescription({
  children,
  className,
  ...props
}: AlertDescriptionProps) {
  return (
    <Text
      className={cn('text-muted-foreground text-center text-sm', className)}
      {...props}
    >
      {children}
    </Text>
  );
}

export function AlertActions({
  children,
  className,
  ...props
}: AlertActionsProps) {
  return (
    <View className={cn('flex-row gap-4', className)} {...props}>
      {children}
    </View>
  );
}

export function AlertIcon({ children, className }: AlertIconProps) {
  return <View className={className}>{children}</View>;
}
