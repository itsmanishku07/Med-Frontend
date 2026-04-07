import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { AlertTriangle, Trash2, X, Info } from 'lucide-react'

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Discard",
  cancelLabel = "Cancel",
  type = "danger", // danger, warning, info
  icon: CustomIcon
}) => {
  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-red-200',
          headerBg: 'bg-red-50/50'
        }
      case 'warning':
        return {
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 shadow-amber-200',
          headerBg: 'bg-amber-50/50'
        }
      default: // info
        return {
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-blue-200',
          headerBg: 'bg-blue-50/50'
        }
    }
  }

  const colors = getColors()
  const Icon = CustomIcon || (type === 'danger' ? Trash2 : type === 'warning' ? AlertTriangle : Info)

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-100">
                <div className={`px-6 py-4 flex items-center justify-between border-b border-gray-100 ${colors.headerBg}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.iconBg}`}>
                      <Icon className={`h-5 w-5 ${colors.iconColor}`} aria-hidden="true" />
                    </div>
                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900">
                      {title}
                    </Dialog.Title>
                  </div>
                  <button
                    type="button"
                    className="rounded-full p-1.5 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-all duration-200 focus:outline-none"
                    onClick={onClose}
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="bg-white px-6 py-6 sm:p-8">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left">
                      <div className="mt-2">
                        <p className="text-base text-gray-500 leading-relaxed font-medium">
                          {message}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/50 px-6 py-4 sm:flex sm:flex-row-reverse sm:px-8 gap-3 border-t border-gray-100">
                  <button
                    type="button"
                    className={`inline-flex w-full justify-center rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto ${colors.confirmBtn}`}
                    onClick={onConfirm}
                  >
                    {confirmLabel}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 transition-all duration-200 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    {cancelLabel}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export default ConfirmationModal
