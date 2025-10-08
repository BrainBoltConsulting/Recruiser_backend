export enum CompletionReasonEnum {
  NORMAL = 'NORMAL',
  TIME_PASSED = 'TIME_PASSED',
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
  [CompletionReasonEnum.TIME_PASSED]: 'Time Passed',
  [CompletionReasonEnum.TAB_CLOSE]: 'Tab Close',
  [CompletionReasonEnum.USER_EXIT]: 'User Exit',
  [CompletionReasonEnum.SYSTEM_ERROR]: 'System Error'
}

export const completionTypeVisibleContent = {
  [CompletionTypeEnum.NORMAL]: 'Normal',
  [CompletionTypeEnum.EARLY]: 'Early'
}
