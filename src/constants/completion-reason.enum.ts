export enum CompletionReasonEnum {
  NORMAL = 'NORMAL',
  TAB_CLOSE = 'TAB_CLOSE',
  USER_EXIT = 'USER_EXIT',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

export enum CompletionTypeEnum {
  NORMAL = 'NORMAL',
  EARLY = 'EARLY'
}

export const completionReasonVisibleContent = {
  [CompletionReasonEnum.NORMAL]: 'Normal Completion',
  [CompletionReasonEnum.TAB_CLOSE]: 'Tab Close',
  [CompletionReasonEnum.USER_EXIT]: 'User Exit',
  [CompletionReasonEnum.SYSTEM_ERROR]: 'System Error'
}

export const completionTypeVisibleContent = {
  [CompletionTypeEnum.NORMAL]: 'Normal',
  [CompletionTypeEnum.EARLY]: 'Early'
}
