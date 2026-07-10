import React, { PropsWithChildren } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { designTokens } from '../tokens';

export const Button = ({ children, onPress }: PropsWithChildren<{ onPress?: () => void }>) => (
  <TouchableOpacity onPress={onPress} style={{ backgroundColor: designTokens.colors.brand.primary, padding: designTokens.spacing.md, borderRadius: designTokens.radius.md }}>
    <Text style={{ color: designTokens.colors.text.primary }}>{children}</Text>
  </TouchableOpacity>
);

export const Input = (props: React.ComponentProps<typeof TextInput>) => (
  <TextInput {...props} style={[{ color: designTokens.colors.text.primary, borderColor: designTokens.colors.surface.elevated, borderWidth: 1, padding: designTokens.spacing.md, borderRadius: designTokens.radius.md }, props.style]} />
);

export const Card = ({ children }: PropsWithChildren) => <View style={{ backgroundColor: designTokens.colors.surface.card, padding: designTokens.spacing.md, borderRadius: designTokens.radius.lg }}>{children}</View>;
export const Form = ({ children }: PropsWithChildren) => <View style={{ gap: designTokens.spacing.md }}>{children}</View>;
export const Table = ({ children }: PropsWithChildren) => <View>{children}</View>;
export const Modal = Card;
export const Drawer = Card;
export const Tabs = ({ children }: PropsWithChildren) => <View style={{ flexDirection: 'row', gap: designTokens.spacing.sm }}>{children}</View>;
export const Badge = ({ children }: PropsWithChildren) => <View style={{ backgroundColor: designTokens.colors.brand.accent, borderRadius: designTokens.radius.round, padding: designTokens.spacing.sm }}><Text>{children}</Text></View>;
export const Timeline = ({ children }: PropsWithChildren) => <View style={{ gap: designTokens.spacing.md }}>{children}</View>;
export const EmptyState = ({ message }: { message: string }) => <Text style={{ color: designTokens.colors.text.muted }}>{message}</Text>;
export const LoadingState = () => <ActivityIndicator color={designTokens.colors.brand.primary} />;
export const ErrorState = ({ message }: { message: string }) => <Text style={{ color: designTokens.colors.state.error }}>{message}</Text>;
export const ProfileCard = Card;
export const MarketplaceCard = Card;
export const EventCard = Card;
export const TeamCard = Card;
export const FieldCard = Card;
