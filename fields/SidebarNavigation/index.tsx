import { Fragment, useState, useEffect } from 'react';
import { Combobox, Dialog, Menu, Transition, Switch } from '@headlessui/react';
import { useTimeoutFn } from 'react-use';

import {
    Bars3BottomLeftIcon,
    BellIcon,
    HomeIcon,
    InboxIcon,
    UsersIcon,
    XMarkIcon,
    PencilSquareIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    ClockIcon,
    SunIcon,
    MoonIcon,
    // Test
} from '@heroicons/react/24/outline';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { useNavigationContext } from '../../contexts/NavigationContext';

const navigation = [
    { name: 'Home', icon: HomeIcon, route: 'home' },
    { name: 'Courses', icon: UsersIcon, route: 'courses' },
    { name: 'Inbox', icon: InboxIcon, route: 'inbox' },
    { name: 'My Notes', icon: PencilSquareIcon, route: 'myNotes' },
];
const userNavigation = [
    { name: 'Your Profile', route: 'profile' },
    { name: 'Settings', route: 'settings' },
    { name: 'Sign out' },
];

const people = [
    { id: 1, name: 'Leslie Alexander', url: '#' },
    // More people...
];

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

export default function SidebarNavigation(props: any) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const { theme, changeTheme, hideNavbar, route, switchRoute } = useNavigationContext();

    const [isShowing, setIsShowing] = useState(false);

    let [, , resetIsShowing] = useTimeoutFn(() => setIsShowing(true), 500);

    const [query, setQuery] = useState('');

    const [open, setOpen] = useState(false);

    const filteredPeople =
        query === ''
            ? []
            : people.filter((person) => {
                  return person.name.toLowerCase().includes(query.toLowerCase());
              });

    useEffect(() => {
        var themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
        var themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

        // Change the icons inside the button based on previous settings
        var themeToggleBtn = document.getElementById('theme-toggle');

        themeToggleBtn.addEventListener('click', function () {
            // toggle icons inside button
            themeToggleDarkIcon.classList.toggle('hidden');
            themeToggleLightIcon.classList.toggle('hidden');

            // if set via local storage previously
            if (localStorage.getItem('color-theme')) {
                if (localStorage.getItem('color-theme') === 'light') {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('color-theme', 'dark');
                    changeTheme('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('color-theme', 'light');
                    changeTheme('light');
                }

                // if NOT set via local storage previously
            } else {
                if (document.documentElement.classList.contains('dark')) {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('color-theme', 'light');
                    changeTheme('light');
                } else {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('color-theme', 'dark');
                    changeTheme('dark');
                }
            }
        });
    }, []);

    useEffect(() => {
        var themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
        var themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

        if (theme === 'dark') {
            themeToggleLightIcon.classList.remove('hidden');
        } else {
            themeToggleDarkIcon.classList.remove('hidden');
        }
    }, [theme]);

    return (
        <div className="bg-white dark:bg-cues-dark-3 flex-1">
            <Transition.Root show={open} as={Fragment} afterLeave={() => setQuery('')} appear>
                <Dialog as="div" className="relative z-10" onClose={setOpen}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel class="mx-auto max-w-xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
                                <Combobox onChange={(person: any) => (window.location = person.url)}>
                                    <div className="relative">
                                        <MagnifyingGlassIcon
                                            className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-gray-400"
                                            aria-hidden="true"
                                        />
                                        <Combobox.Input
                                            class="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-800 placeholder-gray-400 focus:ring-0 sm:text-sm"
                                            placeholder="Search..."
                                            onChange={(event: any) => setQuery(event.target.value)}
                                        />
                                    </div>

                                    {filteredPeople.length > 0 && (
                                        <Combobox.Options class="max-h-72 scroll-py-2 overflow-y-auto py-2 text-sm text-gray-800">
                                            {filteredPeople.map((person) => (
                                                <Combobox.Option
                                                    key={person.id}
                                                    value={person}
                                                    class={({ active }) =>
                                                        classNames(
                                                            'cursor-default select-none px-4 py-2',
                                                            active && 'bg-indigo-600 text-white'
                                                        )
                                                    }
                                                >
                                                    {person.name}
                                                </Combobox.Option>
                                            ))}
                                        </Combobox.Options>
                                    )}

                                    {query !== '' && filteredPeople.length === 0 && (
                                        <p className="p-4 text-sm text-gray-500">No people found.</p>
                                    )}
                                </Combobox>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition.Root>
            <Transition.Root show={sidebarOpen} as={Fragment}>
                {/* Mobile */}
                <Dialog as="div" className="relative z-40 md:hidden" onClose={setSidebarOpen}>
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity ease-linear duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-40 flex">
                        <Transition.Child
                            as={Fragment}
                            enter="transition ease-in-out duration-300 transform"
                            enterFrom="-translate-x-full"
                            enterTo="translate-x-0"
                            leave="transition ease-in-out duration-300 transform"
                            leaveFrom="translate-x-0"
                            leaveTo="-translate-x-full"
                        >
                            <Dialog.Panel class="relative flex w-full max-w-xs flex-1 flex-col bg-cues-gray-1 pt-5 pb-4">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-in-out duration-300"
                                    enterFrom="opacity-0"
                                    enterTo="opacity-100"
                                    leave="ease-in-out duration-300"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                                        <button
                                            type="button"
                                            className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                            onClick={() => setSidebarOpen(false)}
                                        >
                                            <span className="sr-only">Close sidebar</span>
                                            <XMarkIcon className="h-5 w-5 text-white" aria-hidden="true" />
                                        </button>
                                    </div>
                                </Transition.Child>
                                <div className="flex flex-shrink-0 items-center px-4">
                                    <img
                                        className="h-8 w-auto"
                                        src={
                                            theme === 'light'
                                                ? 'https://cues-files.s3.amazonaws.com/logo/cues-logo-black-exclamation-hidden.jpg'
                                                : 'https://cues-files.s3.amazonaws.com/logo/cues-logo-white-exclamation-hidden.jpg'
                                        }
                                        alt="Your Company"
                                    />
                                </div>
                                <div className="mt-5 h-0 flex-1 overflow-y-auto">
                                    <nav className="space-y-1 px-2">
                                        {navigation.map((item) => (
                                            <button
                                                key={item.name}
                                                className={classNames(
                                                    item.route === route
                                                        ? 'bg-gray-100 text-gray-900'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                                    'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                                                )}
                                            >
                                                <item.icon
                                                    className={classNames(
                                                        item.route === route
                                                            ? 'text-gray-500'
                                                            : 'text-gray-400 group-hover:text-gray-500',
                                                        'mr-4 flex-shrink-0 h-5 w-5'
                                                    )}
                                                    aria-hidden="true"
                                                />
                                                {item.name}
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                        <div className="w-14 flex-shrink-0" aria-hidden="true">
                            {/* Dummy element to force sidebar to shrink to fit close icon */}
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* Desktop */}
            <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col z-50">
                <div className="flex flex-grow flex-col overflow-y-auto border-r border-gray-200 dark:border-cues-border-dark bg-cues-gray-1 dark:bg-cues-dark-2 pt-5">
                    <div className="flex flex-shrink-0 items-center px-6">
                        <img
                            className="h-7 w-auto"
                            src={
                                theme === 'light'
                                    ? 'https://cues-files.s3.amazonaws.com/logo/cues-logo-black-exclamation-hidden.jpg'
                                    : 'https://cues-files.s3.amazonaws.com/logo/cues-logo-white-exclamation-hidden.jpg'
                            }
                            alt="Your Company"
                        />
                    </div>
                    {/* Sidebar Search */}

                    <div className="mt-8 flex flex-grow flex-col">
                        <nav className="flex-1 space-y-1 pb-4">
                            {navigation.map((item) => (
                                <button
                                    key={item.name}
                                    className={classNames(
                                        item.route === route
                                            ? 'bg-cues-gray-2 dark:bg-cues-dark-active text-black'
                                            : 'text-gray-500 hover:bg-gray-100 hover:text-black',
                                        'w-full group flex items-center px-6 py-3 text-sm font-medium dark:text-white dark:hover:bg-cues-dark-1'
                                    )}
                                    onClick={() => switchRoute(item.route)}
                                >
                                    <item.icon
                                        className={classNames(
                                            item.route === route
                                                ? 'text-black'
                                                : 'text-gray-500 group-hover:text-black dark:group-hover:text-white',
                                            'mr-4 flex-shrink-0 h-5 w-5 dark:text-white'
                                        )}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div className="flex flex-shrink-0 border-t border-gray-200 dark:border-cues-border-dark p-4">
                        <button onClick={() => setOpen(true)} className="group block w-full flex-shrink-0">
                            <div className=" flex items-center">
                                <div className="flex flex-row flex-1 items-center">
                                    <p className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-white ">
                                        Menu
                                    </p>
                                    <div className="ml-auto flex ">
                                        <kbd className="inline-flex items-center rounded border border-gray-200 dark:border-cues-border-dark px-2 py-1 font-sans text-sm font-medium text-gray-400 dark:text-white">
                                            ⌘K
                                        </kbd>
                                    </div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
            {/* MAIN CONTENT AREA */}
            <div className="flex flex-1 flex-col md:pl-64 h-screen bg-white dark:bg-cues-dark-3 overflow-hidden">
                {!hideNavbar && (
                    <div className="sticky top-0 z-10 flex h-14 border-b border-cues-border dark:border-cues-border-dark dark:bg-cues-dark-2 flex-shrink-0">
                        <button
                            type="button"
                            className="border-r border-gray-200 dark:border-cues-border-dark px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cues-blue md:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span className="sr-only">Open sidebar</span>
                            <Bars3BottomLeftIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <div className="flex flex-1 justify-between px-4">
                            <div className="flex items-center flex-1">
                                <div className="mr-4 flex items-center md:mr-6">
                                    {/* <Tooltip content="Tooltip content" trigger="hover"> */}
                                    <button
                                        type="button"
                                        className="ml-1 text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-cues-dark-1 focus:outline-none rounded-lg text-sm p-2.5"
                                    >
                                        <span className="sr-only">Go Back</span>
                                        <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                    {/* </Tooltip> */}
                                    <button
                                        type="button"
                                        className="ml-1 text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-cues-dark-1 focus:outline-none rounded-lg text-sm p-2.5"
                                    >
                                        <span className="sr-only">Go Front</span>
                                        <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                    <button
                                        type="button"
                                        className="ml-1 text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-cues-dark-1 focus:outline-none rounded-lg text-sm p-2.5"
                                    >
                                        <span className="sr-only">Recents</span>
                                        <ClockIcon className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </div>

                                <form
                                    className="flex flex-1 items-center w-full max-w-lg lg:max-w-sm md:ml-0"
                                    action="#"
                                    method="GET"
                                >
                                    <label htmlFor="search" className="sr-only">
                                        Search
                                    </label>
                                    <div className="relative flex-1">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <MagnifyingGlassIcon
                                                className="h-5 w-5 text-gray-400 dark:text-white"
                                                aria-hidden="true"
                                            />
                                        </div>
                                        <input
                                            id="search"
                                            name="search"
                                            className="block w-full rounded-md border border-gray-200 dark:border-cues-border-dark dark:hover:border-white bg-white dark:bg-cues-dark-1 py-2 pl-10 pr-3 leading-5 placeholder-gray-500 dark:placeholder-gray-300 shadow-sm focus:border-cues-blue focus:placeholder-gray-400 focus:outline-none sm:text-sm dark:text-white"
                                            placeholder="Search"
                                            type="search"
                                        />
                                    </div>
                                </form>
                            </div>
                            <div className="ml-4 flex items-center md:ml-6">
                                {/* Switch Theme Button */}
                                <button
                                    id="theme-toggle"
                                    type="button"
                                    class="text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-cues-dark-1 focus:outline-none rounded-lg text-sm p-2.5"
                                >
                                    <span className="sr-only">Change Theme</span>
                                    <MoonIcon
                                        id="theme-toggle-dark-icon"
                                        className="hidden h-5 w-5"
                                        aria-hidden="true"
                                    />
                                    <SunIcon
                                        id="theme-toggle-light-icon"
                                        className="hidden h-5 w-5"
                                        aria-hidden="true"
                                    />
                                </button>
                                <button
                                    data-tooltip-target="tooltip-notifications-button"
                                    type="button"
                                    className="ml-1 text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-cues-dark-1 focus:outline-none rounded-lg text-sm p-2.5"
                                >
                                    <span className="sr-only">View notifications</span>
                                    <BellIcon className="h-5 w-5" aria-hidden="true" />
                                </button>
                                <div
                                    id="tooltip-notifications-button"
                                    role="tooltip"
                                    class="inline-block absolute invisible z-10 py-2 px-3 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 transition-opacity duration-300 tooltip dark:bg-gray-700"
                                >
                                    Notifications
                                    <div class="tooltip-arrow" data-popper-arrow></div>
                                </div>
                                {/* Profile dropdown */}
                                <Menu as="div" className="relative ml-3">
                                    <div>
                                        <Menu.Button
                                            as="button"
                                            class="flex max-w-xs items-center rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        >
                                            <span className="sr-only">Open user menu</span>
                                            <img
                                                className="h-8 w-8 rounded-full"
                                                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                                alt=""
                                            />
                                        </Menu.Button>
                                    </div>
                                    <Transition
                                        as={Fragment}
                                        enter="transition ease-out duration-100"
                                        enterFrom="transform opacity-0 scale-95"
                                        enterTo="transform opacity-100 scale-100"
                                        leave="transition ease-in duration-75"
                                        leaveFrom="transform opacity-100 scale-100"
                                        leaveTo="transform opacity-0 scale-95"
                                    >
                                        <Menu.Items class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                            {userNavigation.map((item) => (
                                                <Menu.Item key={item.name}>
                                                    {({ active }) => (
                                                        <a
                                                            href={item.href}
                                                            class={classNames(
                                                                active ? 'bg-gray-100' : '',
                                                                'block py-2 px-4 text-sm text-gray-700'
                                                            )}
                                                        >
                                                            {item.name}
                                                        </a>
                                                    )}
                                                </Menu.Item>
                                            ))}
                                        </Menu.Items>
                                    </Transition>
                                </Menu>
                            </div>
                        </div>
                    </div>
                )}

                {/* Disable overflow for Inbox */}
                <main className="flex-1 overflow-y-scroll">{props.children}</main>
            </div>
        </div>
    );
}
