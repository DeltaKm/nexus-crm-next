/**
 * Dichiarazioni di tipi personalizzate per risolvere problemi di compatibilità con react-hook-form
 */

import { FieldValues, UseFormReturn } from 'react-hook-form'

declare module 'react-hook-form' {
  // Estende il tipo UseFormReturn per forzare la compatibilità
  interface UseFormReturn<
    TFieldValues extends FieldValues = FieldValues,
    TContext = any,
    TTransformedValues extends FieldValues | undefined = undefined
  > {
    // Forza la compatibilità con i componenti shadcn/ui
    control: any;
  }
}
