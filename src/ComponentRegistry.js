const ComponentRegistry = {
    'async-form': () => import('./components/AsyncForm/AsyncForm'),
    'message-toast': () => import('./components/MessageToast/MessageToast'),
    'loader': () => import('./components/Loader/Loader'),
    'dropdown': () => import('./components/Dropdown/Dropdown'),
    'data-table': () => import('./components/DataTable/DataTable'),
    'tooltip': () => import('./components/Tooltip/Tooltip'),
    'datepicker': () => import('./components/DatePicker/DatePicker'),
    'modal': () => import('./components/Modal/Modal'),
    'confirm': () => import('./components/Confirm/Confirm'),
};

export default ComponentRegistry;
