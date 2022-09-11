import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { CirclePicker } from 'react-color';
import { useCourseContext } from '../contexts/CourseContext';
import { ActivityIndicator } from 'react-native';
import { useNavigationContext } from '../contexts/NavigationContext';
import { SignalSlashIcon } from '@heroicons/react/24/outline';
import { Select } from '@mobiscroll/react5';

const Settings: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { user, userId, org, refreshSubscriptions } = useAppContext();
    const { settings, fetchCourseSettingsData, fetchSchoolUsersData, loadingChannelData, loadingSchoolUsers } =
        useCourseContext();

    const { data, error } = settings;

    const { theme } = useNavigationContext();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [password, setPassword] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [colorCode, setColorCode] = useState('');
    const [academicTerm, setAcademicTerm] = useState('Fall 2021');
    const [selectedStudents, setSelectedStudents] = useState([
        'Tom Cook',
        'Alana Adams',
        'Amy Whineberg',
        'Emma Avery',
        'Sophia Perez',
    ]);
    const [selectedInstructors, setSelectedInstructors] = useState(['Avery Johnson', 'Mitch Marsh']);

    const dummySchoolStudents = [
        {
            value: 'Emilia Birch',
            text: 'Emilia Birch',
        },
        {
            value: 'Tom Cook',
            text: 'Tom Cook',
        },
        {
            value: 'Alana Adams',
            text: 'Alana Adams',
        },
        {
            value: 'Amy Whineberg',
            text: 'Amy Whineberg',
        },
        {
            value: 'Liam Richardson',
            text: 'Liam Richardson',
        },
        {
            value: 'Emma Avery',
            text: 'Emma Avery',
        },
        {
            value: 'Sophia Perez',
            text: 'Sophia Perez',
        },
    ];

    const dummySchoolInstructors = [
        {
            value: 'Avery Johnson',
            text: 'Avery Johnson',
        },
        {
            value: 'Mitch Marsh',
            text: 'Mitch Marsh',
        },
        {
            value: 'Steven Spielberg',
            text: 'Steven Spielberg',
        },
        {
            value: 'Ava Adams',
            text: 'Ava Adams',
        },
    ];

    const colorChoices = [
        '#0450b4',
        '#046dc8',
        '#1184a7',
        '#15a2a2',
        '#6fb1a0',
        '#b4418e',
        '#d94a8c',
        '#ea515f',
        '#fe7434',
        '#f48c06',
    ];

    const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const sections = [
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
        'I',
        'J',
        'K',
        'L',
        'M',
        'N',
        'O',
        'P',
        'Q',
        'R',
        'S',
        'T',
        'U',
        'V',
        'W',
        'X',
        'Y',
        'Z',
    ];
    const filterRoleOptions = [
        {
            value: 'All',
            text: 'All Users',
        },
        {
            value: 'student',
            text: 'Student',
        },
        {
            value: 'instructor',
            text: 'Instructor',
        },
    ];
    const gradeOptions = grades.map((g: any) => {
        return {
            value: g,
            text: g,
        };
    });
    const filterGradeOptions = [
        {
            value: 'All',
            text: 'All Grades',
        },
        ...gradeOptions,
    ];
    const sectionOptions = sections.map((s: any) => {
        return {
            value: s,
            text: s,
        };
    });
    const filterSectionOptions = [
        {
            value: 'All',
            text: 'All Sections',
        },
        ...sectionOptions,
    ];
    const [activeRole, setActiveRole] = useState('All');
    const [activeGrade, setActiveGrade] = useState('All');
    const [activeSection, setActiveSection] = useState('All');
    const [selectedValues, setSelectedValues] = useState<any[]>([]);
    const [selectedModerators, setSelectedModerators] = useState<any[]>([]);

    const [tab, setTab] = useState('Course Details');

    const tabs = ['Course Details', 'Teams'];

    function classNames(...classes: string[]) {
        return classes.filter(Boolean).join(' ');
    }

    useEffect(() => {
        if (user) {
            fetchSchoolUsersData({
                variables: {
                    schoolId: user.schoolId,
                },
            });
        }
    }, [user]);

    useEffect(() => {
        if (data) {
            setName(data.name);
            setPassword(data.password ? data.password : '');
            setDescription(data.description);
            setColorCode(data.colorCode);
        }
    }, [data]);

    if (loadingChannelData) {
        return (
            <div
                style={{
                    width: '100%',
                    flex: 1,
                    justifyContent: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    marginTop: 50,
                    marginBottom: 50,
                }}
            >
                <ActivityIndicator color={theme === 'light' ? '#1F1F1F' : '#fff'} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-1 flex-col w-full items-center py-12">
                <div className="text-center">
                    <SignalSlashIcon className="mx-auto h-16 w-16 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                        Failed to fetch course data. Try again.
                    </h3>
                </div>
                <div className="mt-6">
                    <button
                        type="button"
                        className="inline-flex items-center rounded-md border border-transparent bg-cues-blue px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none"
                        onClick={() => fetchCourseSettingsData()}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center">
            <div className="w-full hidden sm:block mt-4">
                <div className="w-full flex items-center justify-between border-b border-gray-200 dark:border-cues-border-dark px-4 sm:px-6 lg:mx-auto lg:px-8">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {tabs.map((option) => (
                            <button
                                key={option}
                                className={classNames(
                                    tab === option
                                        ? 'border-black text-black dark:border-white dark:text-white'
                                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-100',
                                    'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-md'
                                )}
                                aria-current={tab === option ? 'page' : undefined}
                                onClick={() => setTab(option)}
                            >
                                {option}
                            </button>
                        ))}
                    </nav>
                    {/* <div className="flex items-center mb-2">
                        <button
                            type="button"
                            className="mr-3 text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-cues-dark-1 focus:outline-none rounded-lg text-sm p-2.5"
                            onClick={() => {
                                setShowFilterPopup(true);
                            }}
                        >
                            <span className="sr-only">Filter events</span>
                            <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            className="inline-flex items-center rounded-md border border-transparent bg-cues-blue px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none"
                            onClick={() => showAddEvent()}
                        >
                            <PlusIcon className="-ml-1 mr-3 h-4 w-4" aria-hidden="true" />
                            New
                        </button>
                    </div> */}
                </div>
            </div>
            <form className="p-8 lg:max-w-3xl w-full">
                <div className="mb-6">
                    <label
                        htmlFor="channel-name"
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                        Course name
                    </label>
                    <input
                        type="channel-name"
                        id="channel-name"
                        className="bg-white border border-cues-border dark:border-cues-border-dark text-gray-900 text-sm rounded-lg focus:ring-cues-blue focus:border-cues-blue block w-full p-2.5 dark:bg-cues-dark-3 dark:placeholder-gray-300 dark:text-white dark:focus:ring-cues-blue dark:focus:border-cues-blue"
                        placeholder="ex. Physics"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="message" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Description
                    </label>
                    <textarea
                        id="message"
                        rows={4}
                        className="block p-2.5 w-full text-sm text-gray-900 bg-white rounded-lg border border-solid border-cues-border dark:border-cues-border-dark focus:ring-cues-blue focus:border-cues-blue dark:bg-cues-dark-3 dark:placeholder-gray-300 dark:text-white dark:focus:ring-cues-blue dark:focus:border-cues-blue"
                        placeholder="About the course..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="message" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Theme Color
                    </label>
                    <CirclePicker
                        colors={colorChoices}
                        color={colorCode}
                        onChangeComplete={(color: any) => setColorCode(color.hex)}
                        width={'220px'}
                    />
                </div>
                <div className="mb-6">
                    <div className="flex justify-between items-center w-full mb-4">
                        <label htmlFor="message" className="block text-sm font-medium text-gray-900 dark:text-white">
                            Students
                        </label>

                        <button>
                            <p className="text-sm text-gray-700 dark:text-gray-400">Filter</p>
                        </button>
                    </div>

                    <Select
                        selectMultiple={true}
                        touchUi={true}
                        themeVariant={theme}
                        value={selectedStudents}
                        onChange={(val: any) => {
                            setSelectedStudents(val.value);
                        }}
                        responsive={{
                            small: {
                                display: 'bubble',
                            },
                            medium: {
                                touchUi: false,
                            },
                        }}
                        style={{
                            backgroundColor: '#f8f8f8',
                        }}
                        data={dummySchoolStudents}
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="message" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Instructors
                    </label>
                    <Select
                        selectMultiple={true}
                        touchUi={true}
                        themeVariant={theme}
                        value={selectedInstructors}
                        onChange={(val: any) => {
                            setSelectedInstructors(val.value);
                        }}
                        responsive={{
                            small: {
                                display: 'bubble',
                            },
                            medium: {
                                touchUi: false,
                            },
                        }}
                        style={{
                            backgroundColor: '#f8f8f8',
                        }}
                        data={dummySchoolInstructors}
                    />
                </div>
                <div className="flex flex-row justify-end">
                    <button
                        type="button"
                        className="inline-flex mr-4 items-center rounded-md border border-cues-border dark:border-cues-border-dark bg-white dark:bg-cues-dark-3 px-6 py-2.5 text-sm font-medium text-black dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none dark:hover:border-white"
                        // onClick={() => closeEventForm()}
                    >
                        Duplicate
                    </button>
                    <button
                        type="button"
                        className="inline-flex mr-4 items-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-indigo-200 focus:outline-none"
                    >
                        Delete
                    </button>

                    <button
                        type="submit"
                        className="inline-flex items-center rounded-md border border-transparent bg-cues-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none"
                    >
                        Save
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings;
