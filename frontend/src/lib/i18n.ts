/**
 * Tiny translation layer. Two languages, no runtime dependency.
 *
 * A phrase is either a plain string or a set of plural forms selected by the
 * `count` variable. Placeholders use `{name}` and are replaced from `vars`.
 *
 * `en` is the source of truth: `ru` is typed as `Record<TranslationKey, Phrase>`,
 * so a missing or misspelled key fails the typecheck instead of shipping.
 */

export type Language = 'en' | 'ru'

export interface PluralForms {
  one: string
  few?: string
  many?: string
  other: string
}

export type Phrase = string | PluralForms

export type TranslationVars = Record<string, string | number>

export const LANGUAGES: { value: Language; nativeLabel: string }[] = [
  { value: 'en', nativeLabel: 'English' },
  { value: 'ru', nativeLabel: 'Русский' },
]

const en = {
  // ---- Generic ----
  'app.tagline': 'Own your day.',
  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'common.back': 'Back',
  'common.continue': 'Continue',
  'common.confirm': 'Confirm',
  'common.undo': 'Undo',
  'common.today': 'Today',
  'common.tomorrow': 'Tomorrow',
  'common.yesterday': 'Yesterday',
  'common.older': 'Older',
  'common.all': 'All',
  'common.active': 'Active',
  'common.completed': 'Completed',
  'common.you': 'there',
  'common.loading': 'Loading {app}',
  'unit.hourShort': 'h',
  'unit.minuteShort': 'm',

  'greeting.morning': 'Good morning',
  'greeting.afternoon': 'Good afternoon',
  'greeting.evening': 'Good evening',

  'priority.low': 'Low',
  'priority.medium': 'Medium',
  'priority.high': 'High',
  'priority.short.low': 'Low',
  'priority.short.medium': 'Mid',
  'priority.short.high': 'High',
  'priority.aria': '{priority} priority',

  'status.todo': 'To do',
  'status.in_progress': 'In progress',
  'status.done': 'Done',

  'list.filter': 'Show',
  'list.all': 'All',
  'list.todo': 'To do',
  'list.in_progress': 'In progress',
  'list.done': 'Done',
  'task.status': 'Status',

  // ---- Navigation ----
  'nav.today': 'Today',
  'nav.upcoming': 'Upcoming',
  'nav.inbox': 'Inbox',
  'nav.completed': 'Completed',
  'nav.analytics': 'Analytics',
  'nav.upcomingShort': 'Soon',
  'nav.completedShort': 'Done',
  'nav.analyticsShort': 'Stats',
  'nav.primary': 'Primary navigation',
  'nav.home': '{app} home',
  'nav.skipToContent': 'Skip to content',

  'sidebar.collapse': 'Collapse sidebar',
  'sidebar.expand': 'Expand sidebar',
  'sidebar.categories': 'Categories',
  'sidebar.newCategory': 'New category',
  'sidebar.logout': 'Logout',
  'sidebar.signOutTitle': 'Sign out?',
  'sidebar.signOutDescription': 'Your tasks stay safely in the cloud and sync back when you return.',
  'sidebar.signOutConfirm': 'Sign out',

  'header.search': 'Search tasks',
  'header.closeSearch': 'Close search',
  'header.searchPlaceholder': 'Search by title, notes or category…',
  'header.settings': 'Settings',

  // ---- Filters ----
  'filters.button': 'Filters',
  'filters.dialog': 'Filter tasks',
  'filters.priority': 'Priority',
  'filters.status': 'Status',
  'filters.category': 'Category',
  'filters.state': 'State',
  'filters.reset': 'Reset filters',

  // ---- Quick add ----
  'quickAdd.trigger': 'Add task',
  'quickAdd.placeholder': 'What needs to be done?',
  'quickAdd.titleLabel': 'Task title',
  'quickAdd.details': 'Details',
  'quickAdd.submit': 'Add task',
  'quickAdd.date': 'Date',
  'quickAdd.time': 'Time',
  'quickAdd.priority': 'Priority',
  'quickAdd.category': 'Category',
  'quickAdd.noCategory': 'No category',
  'quickAdd.estimated': 'Estimated minutes',
  'quickAdd.description': 'Description',
  'quickAdd.descriptionPlaceholder': 'Optional notes',

  // ---- Task row ----
  'task.openDetails': 'Open details for {title}',
  'task.reorder': 'Reorder {title}',
  'task.moveToTomorrow': 'Move to tomorrow',
  'task.startFocus': 'Start focus session',
  'task.edit': 'Edit task',
  'task.delete': 'Delete task',
  'task.complete': 'Complete "{title}"',
  'task.markActive': 'Mark "{title}" as active',
  'task.subtaskProgress': '{done}/{total} subtasks',
  'task.copyTitle': '{title} (copy)',

  // ---- Task details ----
  'details.eyebrow': 'Task details',
  'details.saving': 'Saving…',
  'details.saved': 'Saved',
  'details.close': 'Close details',
  'details.aria': 'Task details: {title}',
  'details.title': 'Title',
  'details.notes': 'Notes',
  'details.notesPlaceholder': 'Add context, links or the next step…',
  'details.status': 'Status',
  'details.priority': 'Priority',
  'details.date': 'Date',
  'details.time': 'Time',
  'details.duration': 'Duration',
  'details.durationPlaceholder': 'Minutes',
  'details.category': 'Category',
  'details.noCategory': 'No category',
  'details.subtasks': 'Subtasks',
  'details.addSubtask': 'Add subtask',
  'details.newSubtask': 'New subtask',
  'details.subtaskAria': 'Subtask: {title}',
  'details.deleteSubtask': 'Delete subtask {title}',
  'details.created': 'Created {date}',
  'details.completedAt': 'Completed {date}',
  'details.focus': 'Focus',
  'details.duplicate': 'Duplicate',
  'details.delete': 'Delete',

  // ---- Confirmations ----
  'confirm.deleteTask.title': 'Delete this task?',
  'confirm.deleteTask.description':
    '"{title}" and its subtasks will be removed. You can undo this right after.',
  'confirm.deleteTask.confirm': 'Delete',
  'confirm.deleteCategory.title': 'Delete "{name}"?',
  'confirm.deleteCategory.description': 'Tasks in this category are kept — they simply become uncategorised.',
  'confirm.deleteCategory.confirm': 'Delete category',

  // ---- Toasts and errors ----
  'toast.taskCreated': 'Task created',
  'toast.taskSaved': 'Changes saved',
  'toast.taskDeleted': 'Task deleted',
  'toast.movedToTomorrow': 'Moved to tomorrow',
  'toast.taskDuplicated': 'Task duplicated',
  'toast.taskCompleted': 'Task completed',
  'toast.profileUpdated': 'Profile updated',
  'toast.passwordUpdated': 'Password updated',
  'toast.dismiss': 'Dismiss notification',
  'toast.notifications': 'Notifications',

  'error.generic': 'Something went wrong. Please try again.',
  'error.loadTasks': 'Could not load your tasks',
  'error.createTask': 'Could not create task',
  'error.saveTask': 'Could not save task',
  'error.deleteTask': 'Could not delete task',
  'error.restoreTask': 'Could not restore task',
  'error.restoreSubtasks': 'Task restored without its subtasks',
  'error.reorder': 'Could not save the new order',
  'error.createCategory': 'Could not create category',
  'error.deleteCategory': 'Could not delete category',
  'error.addSubtask': 'Could not add subtask',
  'error.saveSubtask': 'Could not save subtask',
  'error.deleteSubtask': 'Could not delete subtask',
  'error.saveSettings': 'Could not save settings',
  'error.updateProfile': 'Could not update profile',
  'error.loadAccount': 'Could not load your account',
  'error.session': 'Session error',
  'error.signOut': 'Could not sign out cleanly',

  // ---- Today ----
  'today.focus': "Today's focus",
  'today.completedWord': 'completed',
  'today.progressAria': 'Tasks completed today',
  'today.glance': 'Today at a glance',
  'today.streak': 'Streak',
  'today.streakCaption': {
    one: 'day at a goal of {goal}',
    other: 'days at a goal of {goal}',
  },
  'today.streakEmpty': {
    one: 'Complete {count} task today to start one',
    other: 'Complete {count} tasks today to start one',
  },
  'today.overdue': 'Overdue · {count}',
  'today.overdueAria': 'Overdue tasks',
  'today.moveAllToToday': 'Move all to today',
  'today.tasksAria': "Today's tasks",
  'today.completedSection': 'Completed · {count}',
  'today.completedAria': 'Completed today',
  'today.emptyTitle': "You're all clear.",
  'today.emptyDescription':
    'Everything planned for today is done. Capture the next thing whenever it arrives.',
  'today.allDoneTitle': 'Everything planned for today is done.',
  'today.allDoneDescription': 'Enjoy the quiet, or pull something forward from Upcoming.',

  // ---- Upcoming ----
  'upcoming.eyebrow': 'Schedule',
  'upcoming.title': 'Upcoming',
  'upcoming.pickDate': 'Pick a date',
  'upcoming.prevMonth': 'Previous month',
  'upcoming.nextMonth': 'Next month',
  'upcoming.prevYear': 'Previous year',
  'upcoming.nextYear': 'Next year',
  'upcoming.jump': 'Jump to a date',
  'upcoming.dayCount': {
    one: '{count} task',
    other: '{count} tasks',
  },
  'upcoming.tasksOn': 'Tasks on {date}',
  'upcoming.emptyTitle': 'Nothing on the horizon.',
  'upcoming.emptyDescription': 'Pick a date above and plan the next thing that actually matters.',

  // ---- Inbox ----
  'inbox.eyebrow': 'Capture',
  'inbox.title': 'Inbox',
  'inbox.schedule': 'Schedule',
  'inbox.pickDate': 'Pick date',
  'inbox.pickDateFor': 'Pick a date for {title}',
  'inbox.emptyTitle': 'Nothing to do.',
  'inbox.emptyDescription': 'Tasks marked “To do” are listed here. Moving the due date does not change the status.',

  // ---- Completed ----
  'completed.eyebrow': 'Archive',
  'completed.title': 'Completed',
  'completed.restoreAll': 'Restore all',
  'completed.groupAria': 'Completed {title}',
  'completed.emptyTitle': 'No finished work yet.',
  'completed.emptyDescription': 'Completed tasks collect here, grouped by the day you closed them.',

  // ---- Analytics ----
  'analytics.eyebrow': 'Signal',
  'analytics.title': 'Analytics',
  'analytics.completedToday': 'Completed today',
  'analytics.goalNote': 'Goal {goal}',
  'analytics.thisWeek': 'This week',
  'analytics.last7Days': 'Last 7 days',
  'analytics.completionRate': 'Completion rate',
  'analytics.ofScheduled': 'Of scheduled work',
  'analytics.averagePerDay': 'Average / day',
  'analytics.currentStreak': 'Current streak',
  'analytics.daysAtGoal': 'Days at goal',
  'analytics.bestStreak': 'Best streak',
  'analytics.allTime': 'All time',
  'analytics.estimatedFocus': 'Estimated focus',
  'analytics.completedThisWeek': 'Completed this week',
  'analytics.overdue': 'Overdue',
  'analytics.overdueNote': 'Still unplanned',
  'analytics.chartTitle': 'Completed, last 7 days',
  'analytics.chartAria': 'Tasks completed per day',
  'analytics.scoreTitle': 'Productivity score',
  'analytics.scoreExplanation':
    "Weighted from completion rate (40), today's goal (25), current streak (25) and overdue load (10).",
  'analytics.heatmapTitle': 'Activity, last 120 days',
  'analytics.heatmapDay': '{date} — {count} completed',

  // ---- Settings ----
  'settings.eyebrow': 'Preferences',
  'settings.title': 'Settings',
  'settings.profile': 'Profile',
  'settings.profileDescription': 'How {app} greets you.',
  'settings.displayName': 'Display name',
  'settings.saveName': 'Save name',
  'settings.appearance': 'Appearance',
  'settings.appearanceDescription': 'Light, dark, or a high-contrast theme that stays clear without colour alone.',
  'settings.theme': 'Theme',
  'settings.themeLight': 'Light',
  'settings.themeDark': 'Dark',
  'settings.themeColorblind': 'Color-blind friendly',
  'settings.language': 'Language',
  'settings.languageDescription': 'Interface text, dates and notifications.',
  'settings.languageEnglish': 'English',
  'settings.languageRussian': 'Русский',
  'settings.productivity': 'Productivity',
  'settings.productivityDescription': 'Drives your streak and productivity score.',
  'settings.dailyGoal': 'Daily goal',
  'settings.dailyGoalHint': 'A day counts toward your streak once you complete this many tasks.',
  'settings.sound': 'Completion sound',
  'settings.soundDescription': 'A short chime when you finish a task.',
  'settings.categories': 'Categories',
  'settings.categoriesDescription': 'Group work into a handful of meaningful buckets.',
  'settings.noCategories': 'No categories yet.',
  'settings.account': 'Account',
  'settings.accountDescription': 'Your sign-in details.',

  // ---- Categories ----
  'category.newTitle': 'New category',
  'category.newDescription': 'Group related work — Work, Study, Health or anything of your own.',
  'category.name': 'Name',
  'category.namePlaceholder': 'Work',
  'category.icon': 'Icon',
  'category.iconAria': 'Icon: {name}',
  'category.create': 'Create category',
  'category.delete': 'Delete category {name}',

  // ---- Focus ----
  'focus.eyebrow': 'Focus',
  'focus.exit': 'Exit focus mode',
  'focus.estimated': 'Estimated {duration}',
  'focus.minutes': '{count} min',
  'focus.custom': 'Custom',
  'focus.customAria': 'Custom duration in minutes',
  'focus.start': 'Start',
  'focus.pause': 'Pause',
  'focus.resume': 'Resume',
  'focus.reset': 'Reset',
  'focus.finish': 'Finish',
  'focus.idle': 'Ready when you are',
  'focus.running': 'In progress — stay with it',
  'focus.paused': 'Paused',
  'focus.finished': 'Session complete',
  'focus.completeTitle': 'Session complete',
  'focus.completeDescription':
    'Did you finish "{title}"? You can also keep it open and run another session.',
  'focus.completeConfirm': 'Mark as done',
  'focus.missing': 'That task is gone.',
  'focus.loading': 'Loading session…',
  'focus.backToToday': 'Back to Today',

  // ---- Auth ----
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.loginTitle': 'Welcome back',
  'auth.loginSubtitle': 'Sign in to pick up exactly where you left off.',
  'auth.signIn': 'Sign in',
  'auth.noAccount': "Don't have an account?",
  'auth.createOne': 'Create one',
  'auth.missingCredentials': 'Enter your email and password.',
  'auth.registerTitle': 'Create account',
  'auth.registerSubtitle': 'A calmer, faster way to run your days.',
  'auth.createAccount': 'Create account',
  'auth.hasAccount': 'Already have an account?',
  'auth.invalidEmail': 'Enter a valid email address.',
  'auth.passwordTooShort': 'Use at least {count} characters for your password.',
  'auth.passwordHint': 'At least {count} characters.',
  'auth.displayName': 'Display name',
  'auth.optional': 'Optional',
  'auth.switchLanguage': 'Language',

  'api.error.taskNotFound': 'Task not found',
  'api.error.invalidCredentials': 'Invalid email or password',
  'api.error.emailExists': 'A user with this email already exists',
  'api.error.unauthorized': 'Please sign in to continue',
  'api.error.network': 'Could not connect to the server',
  'api.error.notFound': 'Not found',
  'api.error.conflict': 'This action conflicts with existing data',
  'api.error.validation': 'Please check the entered data',
  'api.error.forbidden': 'You do not have access to this resource',
  'api.error.server': 'Something went wrong on the server. Please try again.',

  'notFound.back': 'Back to Today',

  // ---- Onboarding ----
  'onboarding.step': 'Step {current} of {total}',
  'onboarding.nameTitle': "What's your name?",
  'onboarding.nameSubtitle': 'Used for your daily greeting. Nothing else.',
  'onboarding.goalTitle': 'Set a daily goal',
  'onboarding.goalSubtitle':
    'How many tasks would you like to complete each day? This drives your streak.',
  'onboarding.goalAria': 'Custom daily goal',
  'onboarding.readyTitle': "You're ready.",
  'onboarding.readySubtitle':
    'Add a task with the button on Today. Everything syncs across your devices automatically.',
  'onboarding.openToday': 'Open Today',











  'common.save': 'Save',
  'common.create': 'Create',
  'common.copy': 'Copy',
  'common.optional': 'Optional',

  // ---- Misc screens ----
  'offline.message': 'Offline — showing your last synced tasks',
  'session.offlineTitle': 'Can’t reach the server',
  'session.offlineBody': 'Your sign-in is still saved. Try again when the connection is back.',
  'session.retry': 'Try again',
  'notFound.eyebrow': '404',
  'notFound.title': "This page doesn't exist.",
  'notFound.description': 'The link may be outdated. Your tasks are safe where you left them.',
} as const satisfies Record<string, Phrase>

export type TranslationKey = keyof typeof en

const ru: Record<TranslationKey, Phrase> = {
  'app.tagline': 'Управляй своим днём.',
  'common.cancel': 'Отмена',
  'common.close': 'Закрыть',
  'common.back': 'Назад',
  'common.continue': 'Продолжить',
  'common.confirm': 'Подтвердить',
  'common.undo': 'Вернуть',
  'common.today': 'Сегодня',
  'common.tomorrow': 'Завтра',
  'common.yesterday': 'Вчера',
  'common.older': 'Ранее',
  'common.all': 'Все',
  'common.active': 'Активные',
  'common.completed': 'Выполненные',
  'common.you': 'друг',
  'common.loading': 'Загрузка {app}',
  'unit.hourShort': 'ч',
  'unit.minuteShort': 'мин',

  'greeting.morning': 'Доброе утро',
  'greeting.afternoon': 'Добрый день',
  'greeting.evening': 'Добрый вечер',

  'priority.low': 'Низкий',
  'priority.medium': 'Средний',
  'priority.high': 'Высокий',
  'priority.short.low': 'Низ.',
  'priority.short.medium': 'Ср.',
  'priority.short.high': 'Выс.',
  'priority.aria': 'приоритет: {priority}',

  'status.todo': 'К выполнению',
  'status.in_progress': 'В работе',
  'status.done': 'Выполнено',

  'list.filter': 'Показать',
  'list.all': 'Все',
  'list.todo': 'К выполнению',
  'list.in_progress': 'В работе',
  'list.done': 'Выполнено',
  'task.status': 'Статус',

  'nav.today': 'Сегодня',
  'nav.upcoming': 'Предстоящие',
  'nav.inbox': 'Входящие',
  'nav.completed': 'Выполненные',
  'nav.analytics': 'Аналитика',
  'nav.upcomingShort': 'Скоро',
  'nav.completedShort': 'Готово',
  'nav.analyticsShort': 'Статы',
  'nav.primary': 'Основная навигация',
  'nav.home': 'На главную {app}',
  'nav.skipToContent': 'Перейти к содержимому',

  'sidebar.collapse': 'Свернуть панель',
  'sidebar.expand': 'Развернуть панель',
  'sidebar.categories': 'Категории',
  'sidebar.newCategory': 'Новая категория',
  'sidebar.logout': 'Выйти',
  'sidebar.signOutTitle': 'Выйти из аккаунта?',
  'sidebar.signOutDescription': 'Задачи останутся в облаке и синхронизируются, когда вы вернётесь.',
  'sidebar.signOutConfirm': 'Выйти',

  'header.search': 'Поиск задач',
  'header.closeSearch': 'Закрыть поиск',
  'header.searchPlaceholder': 'Искать по названию, заметкам или категории…',
  'header.settings': 'Настройки',

  'filters.button': 'Фильтры',
  'filters.dialog': 'Фильтры задач',
  'filters.priority': 'Приоритет',
  'filters.status': 'Статус',
  'filters.category': 'Категория',
  'filters.state': 'Состояние',
  'filters.reset': 'Сбросить фильтры',

  'quickAdd.trigger': 'Добавить задачу',
  'quickAdd.placeholder': 'Что нужно сделать?',
  'quickAdd.titleLabel': 'Название задачи',
  'quickAdd.details': 'Подробнее',
  'quickAdd.submit': 'Добавить задачу',
  'quickAdd.date': 'Дата',
  'quickAdd.time': 'Время',
  'quickAdd.priority': 'Приоритет',
  'quickAdd.category': 'Категория',
  'quickAdd.noCategory': 'Без категории',
  'quickAdd.estimated': 'Примерное время, мин',
  'quickAdd.description': 'Описание',
  'quickAdd.descriptionPlaceholder': 'Необязательные заметки',

  'task.openDetails': 'Открыть задачу «{title}»',
  'task.reorder': 'Переместить «{title}»',
  'task.moveToTomorrow': 'Перенести на завтра',
  'task.startFocus': 'Запустить фокус',
  'task.edit': 'Изменить задачу',
  'task.delete': 'Удалить задачу',
  'task.complete': 'Отметить «{title}» выполненной',
  'task.markActive': 'Вернуть «{title}» в работу',
  'task.subtaskProgress': 'подзадачи: {done}/{total}',
  'task.copyTitle': '{title} (копия)',

  'details.eyebrow': 'Подробнее о задаче',
  'details.saving': 'Сохранение…',
  'details.saved': 'Сохранено',
  'details.close': 'Закрыть панель',
  'details.aria': 'Подробнее о задаче: {title}',
  'details.title': 'Название',
  'details.notes': 'Заметки',
  'details.notesPlaceholder': 'Контекст, ссылки или следующий шаг…',
  'details.status': 'Статус',
  'details.priority': 'Приоритет',
  'details.date': 'Срок выполнения',
  'details.time': 'Время',
  'details.duration': 'Примерное время',
  'details.durationPlaceholder': 'Минуты',
  'details.category': 'Категория',
  'details.noCategory': 'Без категории',
  'details.subtasks': 'Подзадачи',
  'details.addSubtask': 'Добавить подзадачу',
  'details.newSubtask': 'Новая подзадача',
  'details.subtaskAria': 'Подзадача: {title}',
  'details.deleteSubtask': 'Удалить подзадачу «{title}»',
  'details.created': 'Создано {date}',
  'details.completedAt': 'Выполнено {date}',
  'details.focus': 'Фокус',
  'details.duplicate': 'Дублировать',
  'details.delete': 'Удалить',

  'confirm.deleteTask.title': 'Удалить задачу?',
  'confirm.deleteTask.description':
    'Задача «{title}» и её подзадачи будут удалены. Сразу после этого можно отменить.',
  'confirm.deleteTask.confirm': 'Удалить',
  'confirm.deleteCategory.title': 'Удалить «{name}»?',
  'confirm.deleteCategory.description': 'Задачи сохранятся — они просто останутся без категории.',
  'confirm.deleteCategory.confirm': 'Удалить категорию',

  'toast.taskCreated': 'Задача создана',
  'toast.taskSaved': 'Изменения сохранены',
  'toast.taskDeleted': 'Задача удалена',
  'toast.movedToTomorrow': 'Перенесено на завтра',
  'toast.taskDuplicated': 'Задача дублирована',
  'toast.taskCompleted': 'Задача выполнена',
  'toast.profileUpdated': 'Профиль обновлён',
  'toast.passwordUpdated': 'Пароль обновлён',
  'toast.dismiss': 'Скрыть уведомление',
  'toast.notifications': 'Уведомления',

  'error.generic': 'Что-то пошло не так. Попробуйте снова.',
  'error.loadTasks': 'Не удалось загрузить задачи',
  'error.createTask': 'Не удалось создать задачу',
  'error.saveTask': 'Не удалось сохранить задачу',
  'error.deleteTask': 'Не удалось удалить задачу',
  'error.restoreTask': 'Не удалось восстановить задачу',
  'error.restoreSubtasks': 'Задача восстановлена без подзадач',
  'error.reorder': 'Не удалось сохранить новый порядок',
  'error.createCategory': 'Не удалось создать категорию',
  'error.deleteCategory': 'Не удалось удалить категорию',
  'error.addSubtask': 'Не удалось добавить подзадачу',
  'error.saveSubtask': 'Не удалось сохранить подзадачу',
  'error.deleteSubtask': 'Не удалось удалить подзадачу',
  'error.saveSettings': 'Не удалось сохранить настройки',
  'error.updateProfile': 'Не удалось обновить профиль',
  'error.loadAccount': 'Не удалось загрузить аккаунт',
  'error.session': 'Ошибка сессии',
  'error.signOut': 'Не удалось корректно выйти',

  'today.focus': 'Фокус дня',
  'today.completedWord': 'выполнено',
  'today.progressAria': 'Задачи, выполненные сегодня',
  'today.glance': 'Сегодня коротко',
  'today.streak': 'Серия',
  'today.streakCaption': {
    one: 'день при цели {goal}',
    few: 'дня при цели {goal}',
    many: 'дней при цели {goal}',
    other: 'дней при цели {goal}',
  },
  'today.streakEmpty': {
    one: 'Выполните {count} задачу сегодня, чтобы начать серию',
    few: 'Выполните {count} задачи сегодня, чтобы начать серию',
    many: 'Выполните {count} задач сегодня, чтобы начать серию',
    other: 'Выполните {count} задач сегодня, чтобы начать серию',
  },
  'today.overdue': 'Просрочено · {count}',
  'today.overdueAria': 'Просроченные задачи',
  'today.moveAllToToday': 'Перенести всё на сегодня',
  'today.tasksAria': 'Задачи на сегодня',
  'today.completedSection': 'Выполнено · {count}',
  'today.completedAria': 'Выполнено сегодня',
  'today.emptyTitle': 'На сегодня всё выполнено.',
  'today.emptyDescription':
    'Всё запланированное на сегодня сделано. Добавьте следующую задачу, когда она появится.',
  'today.allDoneTitle': 'Всё запланированное на сегодня сделано.',
  'today.allDoneDescription': 'Насладитесь тишиной или подтяните что-нибудь из предстоящего.',

  'upcoming.eyebrow': 'Расписание',
  'upcoming.title': 'Предстоящие',
  'upcoming.pickDate': 'Выберите дату',
  'upcoming.prevMonth': 'Предыдущий месяц',
  'upcoming.nextMonth': 'Следующий месяц',
  'upcoming.prevYear': 'Предыдущий год',
  'upcoming.nextYear': 'Следующий год',
  'upcoming.jump': 'Перейти к дате',
  'upcoming.dayCount': {
    one: '{count} задача',
    few: '{count} задачи',
    many: '{count} задач',
    other: '{count} задач',
  },
  'upcoming.tasksOn': 'Задачи на {date}',
  'upcoming.emptyTitle': 'На горизонте пусто.',
  'upcoming.emptyDescription': 'Выберите дату выше и запланируйте то, что действительно важно.',

  'inbox.eyebrow': 'Захват',
  'inbox.title': 'Входящие',
  'inbox.schedule': 'Запланировать',
  'inbox.pickDate': 'Выбрать дату',
  'inbox.pickDateFor': 'Выберите дату для «{title}»',
  'inbox.emptyTitle': 'Нет задач к выполнению.',
  'inbox.emptyDescription': 'Здесь задачи со статусом «К выполнению». Перенос срока не меняет статус.',

  'completed.eyebrow': 'Архив',
  'completed.title': 'Выполненные',
  'completed.restoreAll': 'Вернуть все',
  'completed.groupAria': 'Выполнено: {title}',
  'completed.emptyTitle': 'Пока ничего не завершено.',
  'completed.emptyDescription': 'Выполненные задачи собираются здесь по дням завершения.',

  'analytics.eyebrow': 'Показатели',
  'analytics.title': 'Аналитика',
  'analytics.completedToday': 'Выполнено сегодня',
  'analytics.goalNote': 'Цель: {goal}',
  'analytics.thisWeek': 'За неделю',
  'analytics.last7Days': 'Последние 7 дней',
  'analytics.completionRate': 'Доля выполнения',
  'analytics.ofScheduled': 'От запланированного',
  'analytics.averagePerDay': 'В среднем за день',
  'analytics.currentStreak': 'Текущая серия',
  'analytics.daysAtGoal': 'Дней в цели',
  'analytics.bestStreak': 'Лучшая серия',
  'analytics.allTime': 'За всё время',
  'analytics.estimatedFocus': 'Время в фокусе',
  'analytics.completedThisWeek': 'Выполнено за неделю',
  'analytics.overdue': 'Просрочено',
  'analytics.overdueNote': 'Ещё не перенесено',
  'analytics.chartTitle': 'Выполнено за последние 7 дней',
  'analytics.chartAria': 'Задачи, выполненные по дням',
  'analytics.scoreTitle': 'Индекс продуктивности',
  'analytics.scoreExplanation':
    'Считается из доли выполнения (40), цели на день (25), текущей серии (25) и просроченных задач (10).',
  'analytics.heatmapTitle': 'Активность за 120 дней',
  'analytics.heatmapDay': '{date} — выполнено: {count}',

  'settings.eyebrow': 'Предпочтения',
  'settings.title': 'Настройки',
  'settings.profile': 'Профиль',
  'settings.profileDescription': 'Как {app} к вам обращается.',
  'settings.displayName': 'Отображаемое имя',
  'settings.saveName': 'Сохранить имя',
  'settings.appearance': 'Оформление',
  'settings.appearanceDescription': 'Светлая, тёмная или контрастная тема: смысл не зависит только от цвета.',
  'settings.theme': 'Тема',
  'settings.themeLight': 'Светлая',
  'settings.themeDark': 'Тёмная',
  'settings.themeColorblind': 'Для дальтоников',
  'settings.language': 'Язык',
  'settings.languageDescription': 'Текст интерфейса, даты и уведомления.',
  'settings.languageEnglish': 'English',
  'settings.languageRussian': 'Русский',
  'settings.productivity': 'Продуктивность',
  'settings.productivityDescription': 'Влияет на серию и индекс продуктивности.',
  'settings.dailyGoal': 'Цель на день',
  'settings.dailyGoalHint': 'День попадает в серию, когда выполнено столько задач.',
  'settings.sound': 'Звук выполнения',
  'settings.soundDescription': 'Короткий сигнал при завершении задачи.',
  'settings.categories': 'Категории',
  'settings.categoriesDescription': 'Разделите работу на несколько осмысленных групп.',
  'settings.noCategories': 'Категорий пока нет.',
  'settings.account': 'Аккаунт',
  'settings.accountDescription': 'Данные для входа.',

  'category.newTitle': 'Новая категория',
  'category.newDescription': 'Сгруппируйте задачи — Работа, Учёба, Здоровье или что-то своё.',
  'category.name': 'Название',
  'category.namePlaceholder': 'Работа',
  'category.icon': 'Иконка',
  'category.iconAria': 'Иконка: {name}',
  'category.create': 'Создать категорию',
  'category.delete': 'Удалить категорию «{name}»',

  'focus.eyebrow': 'Фокус',
  'focus.exit': 'Выйти из режима фокуса',
  'focus.estimated': 'Оценка: {duration}',
  'focus.minutes': '{count} мин',
  'focus.custom': 'Своё',
  'focus.customAria': 'Своя длительность в минутах',
  'focus.start': 'Начать',
  'focus.pause': 'Пауза',
  'focus.resume': 'Продолжить',
  'focus.reset': 'Сбросить',
  'focus.finish': 'Завершить',
  'focus.idle': 'Можно начинать',
  'focus.running': 'Идёт работа — держитесь',
  'focus.paused': 'Пауза',
  'focus.finished': 'Сессия завершена',
  'focus.completeTitle': 'Сессия завершена',
  'focus.completeDescription':
    'Вы закончили «{title}»? Можно оставить задачу и провести ещё одну сессию.',
  'focus.completeConfirm': 'Отметить выполненной',
  'focus.missing': 'Такой задачи больше нет.',
  'focus.loading': 'Загрузка сессии…',
  'focus.backToToday': 'К задачам на сегодня',

  'auth.email': 'Email',
  'auth.password': 'Пароль',
  'auth.loginTitle': 'С возвращением',
  'auth.loginSubtitle': 'Войдите и продолжите с того места, где остановились.',
  'auth.signIn': 'Войти',
  'auth.noAccount': 'Нет аккаунта?',
  'auth.createOne': 'Создать',
  'auth.missingCredentials': 'Введите email и пароль.',
  'auth.registerTitle': 'Создать аккаунт',
  'auth.registerSubtitle': 'Спокойный и быстрый способ управлять своими днями.',
  'auth.createAccount': 'Создать аккаунт',
  'auth.hasAccount': 'Уже есть аккаунт?',
  'auth.invalidEmail': 'Введите корректный email.',
  'auth.passwordTooShort': 'Пароль должен быть не короче {count} символов.',
  'auth.passwordHint': 'Не менее {count} символов.',
  'auth.displayName': 'Имя',
  'auth.optional': 'Необязательно',
  'auth.switchLanguage': 'Язык',

  'api.error.taskNotFound': 'Задача не найдена',
  'api.error.invalidCredentials': 'Неверный email или пароль',
  'api.error.emailExists': 'Пользователь с таким email уже существует',
  'api.error.unauthorized': 'Необходимо войти в аккаунт',
  'api.error.network': 'Не удалось подключиться к серверу',
  'api.error.notFound': 'Не найдено',
  'api.error.conflict': 'Действие конфликтует с существующими данными',
  'api.error.validation': 'Проверьте введённые данные',
  'api.error.forbidden': 'Нет доступа к этому ресурсу',
  'api.error.server': 'Ошибка на сервере. Попробуйте ещё раз.',

  'notFound.back': 'К задачам на сегодня',

  'onboarding.step': 'Шаг {current} из {total}',
  'onboarding.nameTitle': 'Как вас зовут?',
  'onboarding.nameSubtitle': 'Нужно только для приветствия. Больше ни для чего.',
  'onboarding.goalTitle': 'Цель на день',
  'onboarding.goalSubtitle': 'Сколько задач вы хотите выполнять каждый день? От этого зависит серия.',
  'onboarding.goalAria': 'Своя цель на день',
  'onboarding.readyTitle': 'Всё готово.',
  'onboarding.readySubtitle':
    'Добавьте задачу кнопкой на «Сегодня». Всё синхронизируется между устройствами автоматически.',
  'onboarding.openToday': 'Открыть «Сегодня»',











  'common.save': 'Сохранить',
  'common.create': 'Создать',
  'common.copy': 'Копировать',
  'common.optional': 'Необязательно',

  'offline.message': 'Нет сети — показаны последние синхронизированные задачи',
  'session.offlineTitle': 'Нет связи с сервером',
  'session.offlineBody': 'Вход сохранён. Повторите попытку, когда сеть появится.',
  'session.retry': 'Повторить',
  'notFound.eyebrow': '404',
  'notFound.title': 'Такой страницы не существует.',
  'notFound.description': 'Возможно, ссылка устарела. Ваши задачи в целости и сохранности.',
}

const DICTIONARIES: Record<Language, Record<TranslationKey, Phrase>> = { en, ru }

/** Flattened key lists for parity checks and tooling. */
export function translationKeys(): TranslationKey[] {
  return Object.keys(en) as TranslationKey[]
}

export function dictionaryFor(language: Language): Record<TranslationKey, Phrase> {
  return DICTIONARIES[language]
}

export const DEFAULT_LANGUAGE: Language = 'ru'

const STORAGE_KEY = 'po-delu.language'

export function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'ru'
}

/** Last chosen language, used before settings load and if the cloud row is missing. */
export function readStoredLanguage(): Language | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return isLanguage(value) ? value : null
  } catch {
    return null
  }
}

export function writeStoredLanguage(language: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, language)
  } catch {
    // Preference is cosmetic; ignore storage failures.
  }
}

/** Picks a supported language from the browser preferences. */
export function detectLanguage(): Language {
  const stored = readStoredLanguage()
  if (stored) return stored
  const candidates = typeof navigator === 'undefined' ? [] : navigator.languages ?? [navigator.language]
  for (const candidate of candidates) {
    const code = candidate?.slice(0, 2).toLowerCase()
    if (code === 'ru') return 'ru'
    if (code === 'en') return 'en'
  }
  return DEFAULT_LANGUAGE
}

let currentLanguage: Language = DEFAULT_LANGUAGE

/** Set once from the user's saved settings; also used outside React. */
export function setCurrentLanguage(language: Language): void {
  currentLanguage = language
}

export function getCurrentLanguage(): Language {
  return currentLanguage
}

/** Russian needs three plural forms; English needs two. */
export function pluralForm(language: Language, count: number): keyof PluralForms {
  const value = Math.abs(count)
  if (language !== 'ru') return value === 1 ? 'one' : 'other'

  const mod10 = value % 10
  const mod100 = value % 100
  if (mod10 === 1 && mod100 !== 11) return 'one'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'few'
  return 'many'
}

function selectPhrase(phrase: Phrase, language: Language, count: number | undefined): string {
  if (typeof phrase === 'string') return phrase
  if (count === undefined) return phrase.other
  const form = pluralForm(language, count)
  return phrase[form] ?? phrase.other
}

function interpolate(template: string, vars: TranslationVars | undefined): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name]
    return value === undefined ? match : String(value)
  })
}

/** Translates a key in an explicit language. Falls back to English, never to the raw key. */
export function translateIn(
  language: Language,
  key: TranslationKey,
  vars?: TranslationVars,
): string {
  const phrase = DICTIONARIES[language][key] ?? DICTIONARIES.en[key]
  if (!phrase) return ''
  const count = typeof vars?.count === 'number' ? vars.count : undefined
  return interpolate(selectPhrase(phrase, language, count), vars)
}

/** Translates a key in the active language. Safe to call outside React. */
export function translate(key: TranslationKey, vars?: TranslationVars): string {
  return translateIn(currentLanguage, key, vars)
}
