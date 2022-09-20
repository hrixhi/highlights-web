// REACT
import { CheckCircleIcon, CheckIcon } from '@heroicons/react/20/solid';
import { ArrowLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Select } from '@mobiscroll/react5';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CirclePicker } from 'react-color';
import { useNavigationContext } from '../contexts/NavigationContext';
import { RadioGroup } from '@headlessui/react';

import { UserIcon } from '../assets/icons/User';
import { User1Icon } from '../assets/icons/User1';
import { User2Icon } from '../assets/icons/User2';

import { VideoCallIcon } from '../assets/icons/VideoCallIcon';
import { BrowserIcon } from '../assets/icons/BrowserIcon';
import { Trainingicon } from '../assets/icons/TrainingIcon';

import { Location03Icon } from '../assets/icons/Location03Icon';
import { Teacher01Icon } from '../assets/icons/Teacher01Icon';
import { MonitorIcon } from '../assets/icons/MonitorIcon';
import { integrationsDummy } from '../constants/IntegrationsDummy';

// ICONS
import { CameraVideoIcon } from '../assets/icons/CameraVideoIcon';
import { Folder01Icon } from '../assets/icons/Folder01Icon';
import { QuizIcon } from '../assets/icons/QuizIcon';
import { AssignmentIcon } from '../assets/icons/AssignmentIcon';
import { Apps01Icon } from '../assets/icons/apps01Icon';

// APP ICONS
import { CanvasIcon } from '../assets/icons/CanvasIcon';
import { NotesEdit01Icon } from '../assets/icons/NotesEdit01Icon';
import { BoardIcon } from '../assets/icons/BoardIcon';
import { Grid01Icon } from '../assets/icons/Grid01Icon';
import { BarChart01Icon } from '../assets/icons/BarChart01Icon';

// Demo

const NewCourse: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
    const [pageErrors, setPageErrors] = useState([]);

    const { theme } = useNavigationContext();

    function classNames(...classes: string[]) {
        return classes.filter(Boolean).join(' ');
    }

    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedInstructors, setSelectedInstructors] = useState([]);

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

    const courseSizes = [
        {
            id: 1,
            title: 'Small',
            description:
                'Recommended course tools & layouts will support high degree of personalization & individual progress tracking.',
            users: '1-30 learners',
            icon: UserIcon,
        },
        {
            id: 2,
            title: 'Medium',
            description:
                'Recommended course tools that will support limited personalization paired with collective course management.',
            users: '31-99 learners',
            icon: User1Icon,
        },
        {
            id: 3,
            title: 'Large',
            description:
                'Recommended course tools will simplify large-scale course delivery, progress tracking and performance measures.',
            users: '100+ learners',
            icon: User2Icon,
        },
    ];

    const courseDeliveryStyle = [
        {
            id: 1,
            title: 'Asynchronous',
            description: 'Fully self-paced',
            icon: BrowserIcon,
        },
        {
            id: 2,
            title: 'Blended',
            description: 'Mix of self-paced and scheduled',
            icon: VideoCallIcon,
        },
        {
            id: 3,
            title: 'Synchronous',
            description: 'Only scheduled',
            icon: Trainingicon,
        },
    ];

    const courseDeliveryMedium = [
        {
            id: 1,
            title: 'Remote',
            description: 'Only online lessons',
            icon: MonitorIcon,
        },
        {
            id: 2,
            title: 'Hybrid',
            description: 'Mix of Online & face-to-face',
            icon: Teacher01Icon,
        },
        {
            id: 3,
            title: 'In-person',
            description: 'Only face-to-face',
            //     'Recommended course tools will simplify large-scale course delivery, progress tracking and performance measures.',
            icon: Location03Icon,
        },
    ];

    // PAGE 3

    const meetingOptions = [
        {
            id: 1,
            title: 'Online Meetings',
            description: 'Create online meetings with Zoom or other meeting tool of your choice.',
        },
        {
            id: 2,
            title: 'Cues Virtual Classroom',
            description:
                'Our interactive environment to recreate classroom activities such as lectures, individual & group work stations. Useful for blended learning models such as Flipped classroom and Station Rotation.',
        },
    ];

    const courseworkOrganizationOptions = [
        {
            id: 1,
            title: 'Playlists',
            description:
                'Our unique course delivery method enables self-paced & blended lessons with real-time insights into progress & understanding.',
        },
        {
            id: 2,
            title: 'Activities',
            description: 'Create enriching learning experiences for your students.',
        },
        {
            id: 3,
            title: 'Projects',
            description: 'For courses that heavily rely long-duration assignments. Ex. Arts or Computer Science.',
        },
        {
            id: 4,
            title: 'Explore',
            description:
                'Create exploration zones with bit-sized lessons for your students discover beyond just your coursework.',
        },
    ];

    const discussionOptions = [
        {
            id: 1,
            title: 'Topic-based Q&A',
            description: 'Recommended for promoting more discovery through topics.',
        },
        {
            id: 2,
            title: 'Threaded discussion',
            description: 'Recommended for doubt solving on a larger scale.',
        },
    ];

    const assessmentsOptions = [
        {
            id: 1,
            title: 'Traditional Grading',
            description: 'Create a gradebook with Assignment scores and a total/letter grade.',
        },
        {
            id: 2,
            title: 'Standards-based Grading',
            description: 'Assess students on mastery achieved with different learning standards/outcomes.',
        },
        {
            id: 3,
            title: 'Participation',
            description:
                'Assign points for participation through attendance, discussion, and classroom involvement etc.',
        },
        {
            id: 3,
            title: 'Portfolio',
            description:
                'Useful for courses where scores are assigned to long-term projects/pieces of work such as in Arts, Literature, or Design. Students will be able to demonstrate their portfolios at the end of course.',
        },
        {
            id: 4,
            title: 'Gamification',
            description:
                'Our own unique course assessment format. Students score points as they progress through lessons and achieve mastery.',
        },
    ];

    const cuesAppOptions = [
        {
            id: 1,
            title: 'Organizer',
            description: 'Assign & Manage tasks with deadlines for your students individually or in groups.',
            icon: NotesEdit01Icon,
            background: 'bg-indigo-500',
        },
        {
            id: 2,
            title: 'Whiteboard',
            description: 'Draw, Sketch, Highlight - Bring your ideas to life & collaborate with students.',
            icon: CanvasIcon,
            background: 'bg-red-500',
        },
        {
            id: 1,
            title: 'Polls',
            description: 'Conduct polls with your real-time student responses.',
            icon: BarChart01Icon,
            background: 'bg-teal-500',
        },
        {
            id: 1,
            title: 'Presentations',
            description: 'Create beautiful & interactive presentations.',
            icon: BoardIcon,
            background: 'bg-purple-500',
        },
    ];

    // Step 1 Fields
    const [courseName, setCourseName] = useState('');
    const [courseDescription, setCourseDescription] = useState('');
    const [courseColor, setCourseColor] = useState('');
    const [academicTerm, setAcademicTerm] = useState('None');

    //
    const [selectedCourseSize, setSelectedCourseSize] = useState<any>();
    const [selectedCourseDelivery, setSelectedCourseDelivery] = useState<any>();
    const [selectedCourseMedium, setSelectedCourseMedium] = useState<any>();

    const [selectedIntegrations, setSelectedIntegrations] = useState<any[]>([]);

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

    const academicTermDummy = [
        {
            text: 'None',
            value: 'None',
        },
        {
            text: 'Year 2022-23',
            value: 'Year 2022-23',
        },
        {
            text: 'Fall 2022',
            value: 'Fall 2022',
        },
        {
            text: 'Spring 2023',
            value: 'Spring 2023',
        },
    ];

    //

    const [newCourseSteps, setNewCourseSteps] = useState([
        {
            id: 1,
            name: 'Details',
            status: 'current',
            description: 'Provide information about your course.',
        },
        {
            id: 2,
            name: 'Delivery',
            status: 'upcoming',
            description:
                'Select your course size & delivery mode to help us better customize your learning environment.',
        },
        {
            id: 3,
            name: 'Customize',
            status: 'upcoming',
            description: 'Equip your courses with the right tools provided by Cues',
        },
        {
            id: 4,
            name: 'Integrations',
            status: 'upcoming',
            description: 'Equip your courses with the 3rd party tools that seamlessly fit within Cues',
        },
        {
            id: 5,
            name: 'Enrollments',
            status: 'upcoming',
            description: 'Add/Invite students, moderators & instructors.',
        },
        {
            id: 6,
            name: 'Publish',
            status: 'upcoming',
        },
    ]);

    const renderIntegrationsList = () => {
        return (
            <ul role="list" className="mt-4 w-full list-none divide-y divide-gray-200">
                {integrationsDummy.map((integration: any) => (
                    <li key={integration.id} className="flex items-center py-4">
                        <img className="h-16 w-16 rounded-lg" src={integration.logo} alt="" />
                        <div className="ml-4 flex-1">
                            <p className="text-md font-medium text-gray-900 dark:text-white">{integration.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-300 line-clamp-2">
                                {integration.description}
                            </p>
                        </div>
                        <div className="ml-4">
                            <button
                                type="button"
                                class={classNames(
                                    selectedIntegrations.includes(integration.id)
                                        ? 'bg-blue-800 dark:bg-blue-700'
                                        : 'bg-cues-blue',
                                    'text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-1.5 focus:outline-none dark:focus:ring-blue-800'
                                )}
                                onClick={() => {
                                    if (selectedIntegrations.includes(integration.id)) {
                                        const filterIntegrations = selectedIntegrations.filter(
                                            (selected) => selected !== integration.id
                                        );
                                        setSelectedIntegrations(filterIntegrations);
                                    } else {
                                        const updateIntegrations = [...selectedIntegrations];
                                        updateIntegrations.push(integration.id);
                                        setSelectedIntegrations(updateIntegrations);
                                    }
                                }}
                            >
                                {selectedIntegrations.includes(integration.id) ? 'Added' : 'Add'}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        );
    };

    const renderActiveCourseHeader = () => {
        const activeTab = newCourseSteps.find((step: any) => step.id === currentStep);

        if (!activeTab) return null;

        return (
            <div className="w-full">
                <h1 className="text-xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:leading-9">
                    {activeTab.name}
                </h1>
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-300">{activeTab.description}</div>
            </div>
        );
    };

    const renderActiveCourseTab = () => {
        if (currentStep === 1) {
            return (
                <div className="w-full">
                    <div className="lg:max-w-3xl">
                        <div className="mb-6">
                            <label
                                htmlFor="course-name"
                                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
                                Course name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="course-name"
                                id="course-name"
                                className="bg-white border border-cues-border dark:border-cues-border-dark text-gray-900 text-sm rounded-lg focus:ring-cues-blue focus:border-cues-blue block w-full p-2.5 dark:bg-cues-dark-3 dark:placeholder-gray-300 dark:text-white dark:focus:ring-cues-blue dark:focus:border-cues-blue"
                                placeholder="ex. Literature"
                                required
                                value={courseName}
                                onChange={(e) => setCourseName(e.target.value)}
                            />
                        </div>

                        <div className="mb-6">
                            <label
                                htmlFor="message"
                                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
                                Description
                            </label>
                            <textarea
                                id="message"
                                rows={4}
                                className="block p-2.5 w-full text-sm text-gray-900 bg-white rounded-lg border border-solid border-cues-border dark:border-cues-border-dark focus:ring-cues-blue focus:border-cues-blue dark:bg-cues-dark-3 dark:placeholder-gray-300 dark:text-white dark:focus:ring-cues-blue dark:focus:border-cues-blue"
                                placeholder="About the course..."
                                value={courseDescription}
                                onChange={(e) => setCourseDescription(e.target.value)}
                            />
                        </div>
                        <div className="mb-6">
                            <label
                                htmlFor="message"
                                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
                                Theme Color <span className="text-red-500">*</span>
                            </label>
                            <CirclePicker
                                colors={colorChoices}
                                color={courseColor}
                                onChangeComplete={(color: any) => setCourseColor(color.hex)}
                                width={'220px'}
                            />
                        </div>
                        <div className="mb-6">
                            <label
                                htmlFor="message"
                                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
                                Academic Term <span className="text-red-500">*</span>
                            </label>
                            <Select
                                id="filterChannel"
                                touchUi={true}
                                theme="ios"
                                themeVariant={theme}
                                value={academicTerm}
                                onChange={(val: any) => {
                                    setAcademicTerm(val.value);
                                }}
                                responsive={{
                                    small: {
                                        display: 'bubble',
                                    },
                                    medium: {
                                        touchUi: false,
                                    },
                                }}
                                dropdown={false}
                                data={academicTermDummy}
                            />
                        </div>
                    </div>
                </div>
            );
        } else if (currentStep === 2) {
            return (
                <div className="w-full lg:max-w-3xl">
                    <div className="">
                        <RadioGroup
                            value={selectedCourseSize}
                            by={'id'}
                            onChange={(value) => setSelectedCourseSize(value)}
                        >
                            <RadioGroup.Label class="text-base font-medium text-gray-900  dark:text-white">
                                Course size <span className="text-red-500">*</span>
                            </RadioGroup.Label>

                            <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-3 sm:gap-x-8">
                                {courseSizes.map((courseSize: any) => (
                                    <RadioGroup.Option key={courseSize.id} value={courseSize}>
                                        {({ checked, active }) => (
                                            <div
                                                className={classNames(
                                                    checked ? 'border-transparent' : 'border-gray-300',
                                                    active ? 'border-blue-500 ring-2 ring-blue-500' : '',
                                                    'relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none'
                                                )}
                                            >
                                                <span className="flex flex-1">
                                                    <span className="flex flex-col">
                                                        <div className="flex items-center">
                                                            <courseSize.icon className="w-6 h-6 text-black" />
                                                            <RadioGroup.Label
                                                                as="span"
                                                                class="ml-3 block text-md font-medium text-gray-900 dark:text-white"
                                                            >
                                                                {courseSize.title}
                                                            </RadioGroup.Label>
                                                        </div>
                                                        {/* <RadioGroup.Description
                                                            as="span"
                                                            class="mt-3 flex items-center text-sm text-gray-500"
                                                        >
                                                            {courseSize.description}
                                                        </RadioGroup.Description> */}
                                                        <RadioGroup.Description
                                                            as="span"
                                                            class="mt-4 text-xs font-medium text-gray-500 dark:text-gray-300"
                                                        >
                                                            {courseSize.users}
                                                        </RadioGroup.Description>
                                                    </span>
                                                </span>
                                                {checked && (
                                                    <CheckCircleIcon
                                                        className={classNames('h-5 w-5 text-cues-blue')}
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                <span
                                                    className={classNames(
                                                        active ? 'border' : 'border-2',
                                                        checked ? 'border-blue-500' : 'border-transparent',
                                                        'pointer-events-none absolute -inset-px rounded-lg'
                                                    )}
                                                    aria-hidden="true"
                                                />
                                            </div>
                                        )}
                                    </RadioGroup.Option>
                                ))}
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="mt-12">
                        <RadioGroup
                            value={selectedCourseDelivery}
                            by={'id'}
                            onChange={(value) => setSelectedCourseDelivery(value)}
                        >
                            <RadioGroup.Label class="text-base font-medium text-gray-900 dark:text-white">
                                Course delivery style <span className="text-red-500">*</span>
                            </RadioGroup.Label>

                            <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-3 sm:gap-x-8">
                                {courseDeliveryStyle.map((courseDelivery: any) => (
                                    <RadioGroup.Option key={courseDelivery.id} value={courseDelivery}>
                                        {({ checked, active }) => (
                                            <div
                                                className={classNames(
                                                    checked ? 'border-transparent' : 'border-gray-300',
                                                    active ? 'border-blue-500 ring-2 ring-blue-500' : '',
                                                    'relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none'
                                                )}
                                            >
                                                <span className="flex flex-1">
                                                    <span className="flex flex-col">
                                                        <div className="flex items-center">
                                                            <courseDelivery.icon className="w-6 h-6 text-black" />
                                                            <RadioGroup.Label
                                                                as="span"
                                                                class="ml-3 block text-md font-medium text-gray-900 dark:text-white"
                                                            >
                                                                {courseDelivery.title}
                                                            </RadioGroup.Label>
                                                        </div>
                                                        {/* <RadioGroup.Description
                                                            as="span"
                                                            class="mt-3 flex items-center text-sm text-gray-500"
                                                        >
                                                            {courseDelivery.description}
                                                        </RadioGroup.Description> */}
                                                        <RadioGroup.Description
                                                            as="span"
                                                            class="mt-4 text-xs font-medium text-gray-500 dark:text-gray-300"
                                                        >
                                                            {courseDelivery.description}
                                                        </RadioGroup.Description>
                                                    </span>
                                                </span>
                                                {checked && (
                                                    <CheckCircleIcon
                                                        className={classNames('h-5 w-5 text-cues-blue')}
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                <span
                                                    className={classNames(
                                                        active ? 'border' : 'border-2',
                                                        checked ? 'border-blue-500' : 'border-transparent',
                                                        'pointer-events-none absolute -inset-px rounded-lg'
                                                    )}
                                                    aria-hidden="true"
                                                />
                                            </div>
                                        )}
                                    </RadioGroup.Option>
                                ))}
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="mt-12">
                        <RadioGroup
                            value={selectedCourseMedium}
                            by={'id'}
                            onChange={(value) => setSelectedCourseMedium(value)}
                        >
                            <RadioGroup.Label class="text-base font-medium text-gray-900 dark:text-white">
                                Course delivery medium <span className="text-red-500">*</span>
                            </RadioGroup.Label>

                            <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-3 sm:gap-x-8">
                                {courseDeliveryMedium.map((courseMedium: any) => (
                                    <RadioGroup.Option key={courseMedium.id} value={courseMedium}>
                                        {({ checked, active }) => (
                                            <div
                                                className={classNames(
                                                    checked ? 'border-transparent' : 'border-gray-300',
                                                    active ? 'border-blue-500 ring-2 ring-blue-500' : '',
                                                    'relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none'
                                                )}
                                            >
                                                <span className="flex flex-1">
                                                    <span className="flex flex-col">
                                                        <div className="flex items-center">
                                                            <courseMedium.icon className="w-6 h-6 text-black" />
                                                            <RadioGroup.Label
                                                                as="span"
                                                                class="ml-3 block text-md font-medium text-gray-900 dark:text-white"
                                                            >
                                                                {courseMedium.title}
                                                            </RadioGroup.Label>
                                                        </div>
                                                        {/* <RadioGroup.Description
                                                            as="span"
                                                            class="mt-3 flex items-center text-sm text-gray-500"
                                                        >
                                                            {courseMedium.description}
                                                        </RadioGroup.Description> */}
                                                        <RadioGroup.Description
                                                            as="span"
                                                            class="mt-4 text-xs font-medium text-gray-500 dark:text-gray-300"
                                                        >
                                                            {courseMedium.description}
                                                        </RadioGroup.Description>
                                                    </span>
                                                </span>
                                                {checked && (
                                                    <CheckCircleIcon
                                                        className={classNames('h-5 w-5 text-cues-blue')}
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                <span
                                                    className={classNames(
                                                        active ? 'border' : 'border-2',
                                                        checked ? 'border-blue-500' : 'border-transparent',
                                                        'pointer-events-none absolute -inset-px rounded-lg'
                                                    )}
                                                    aria-hidden="true"
                                                />
                                            </div>
                                        )}
                                    </RadioGroup.Option>
                                ))}
                            </div>
                        </RadioGroup>
                    </div>
                </div>
            );
        } else if (currentStep === 3) {
            return (
                <div className="w-full lg:max-w-3xl">
                    {/* MEETING */}
                    {selectedCourseMedium && selectedCourseMedium.id !== 3 && (
                        <div className="mb-12 flex flex-col w-full">
                            <div className="flex items-center w-full border-b border-cues-gray dark:border-cues-border-dark py-2">
                                <CameraVideoIcon class="w-6 h-6" />
                                <div className="ml-2 text-base font-medium text-gray-900 dark:text-white">Meeting</div>
                            </div>

                            <fieldset className="space-y-5">
                                <legend className="sr-only">Meeting Options</legend>
                                {meetingOptions.map((option: any) => {
                                    const id = option.title.toLowerCase().split(' ').join('-');

                                    let recommended = false;

                                    if (
                                        option.id === 1 &&
                                        (selectedCourseSize.id === 2 || selectedCourseSize.id === 3)
                                    ) {
                                        recommended = true;
                                    } else if (option.id === 2 && selectedCourseSize.id === 1) {
                                        recommended = true;
                                    }

                                    return (
                                        <div key={option.id} className="relative flex items-start">
                                            <div className="flex h-5 items-center">
                                                <input
                                                    id={id}
                                                    aria-describedby={`${id}-description`}
                                                    name={id}
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 text-cues-blue focus:ring-cues-blue"
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <div className="flex items-center">
                                                    <label htmlFor={id} className="font-medium text-gray-700">
                                                        {option.title}
                                                    </label>
                                                    {recommended && (
                                                        <div className="ml-3">
                                                            <span class="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800">
                                                                Recommended
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <p id={`${id}-description`} className="text-gray-500">
                                                    {option.description}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </fieldset>
                        </div>
                    )}

                    <div className="mb-12 flex flex-col w-full">
                        <div className="flex items-center w-full border-b border-cues-gray py-2">
                            <Folder01Icon class="w-6 h-6" />
                            <div className="ml-2 text-base font-medium text-gray-900 dark:text-white">Coursework</div>
                        </div>

                        <fieldset className="space-y-5">
                            <legend className="sr-only">Coursework Options</legend>
                            {courseworkOrganizationOptions.map((option: any) => {
                                const id = option.title.toLowerCase().split(' ').join('-');

                                let recommended = false;

                                if (
                                    option.id === 1 &&
                                    (selectedCourseDelivery.id === 1 || selectedCourseDelivery.id === 2)
                                ) {
                                    recommended = true;
                                }

                                return (
                                    <div key={option.id} className="relative flex items-start">
                                        <div className="flex h-5 items-center">
                                            <input
                                                id={id}
                                                aria-describedby={`${id}-description`}
                                                name={id}
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-cues-blue focus:ring-cues-blue"
                                            />
                                        </div>
                                        <div className="ml-3 text-sm">
                                            <div className="flex items-center">
                                                <label htmlFor={id} className="font-medium text-gray-700">
                                                    {option.title}
                                                </label>
                                                {recommended && (
                                                    <div className="ml-3">
                                                        <span class="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800">
                                                            Recommended
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <p id={`${id}-description`} className="text-gray-500">
                                                {option.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </fieldset>
                    </div>

                    <div className="mb-12 flex flex-col w-full">
                        <div className="flex items-center w-full border-b border-cues-gray py-2">
                            <QuizIcon class="w-6 h-6" />
                            <div className="ml-2 text-base font-medium text-gray-900 dark:text-white">
                                Collaboration
                            </div>
                        </div>

                        <fieldset className="mt-5">
                            <legend className="sr-only">Collaboration </legend>
                            <div className="space-y-5">
                                {discussionOptions.map((option: any) => {
                                    const id = option.title.toLowerCase().split(' ').join('-');

                                    let recommended = false;

                                    if (option.id === 1 && selectedCourseSize.id === 1) {
                                        recommended = true;
                                    } else if (option.id === 2 && selectedCourseSize.id === 3) {
                                        recommended = true;
                                    }

                                    return (
                                        <div key={option.id} className="relative flex items-start">
                                            <div className="flex h-5 items-center">
                                                <input
                                                    id={id}
                                                    aria-describedby={`${id}-description`}
                                                    name="plan"
                                                    type="radio"
                                                    defaultChecked={option.id === 1}
                                                    className="h-4 w-4 border-gray-300 text-cues-blue focus:ring-cues-blue"
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <div className="flex items-center">
                                                    <label htmlFor={id} className="font-medium text-gray-700">
                                                        {option.title}
                                                    </label>
                                                    {recommended && (
                                                        <div className="ml-3">
                                                            <span class="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800">
                                                                Recommended
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <p id={`${id}-description`} className="text-gray-500">
                                                    {option.description}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </fieldset>
                    </div>

                    <div className="mb-12 flex flex-col w-full">
                        <div className="flex items-center w-full border-b border-cues-gray py-2">
                            <AssignmentIcon class="w-6 h-6" />
                            <div className="ml-2 text-base font-medium text-gray-900 dark:text-white">Assessment</div>
                        </div>
                        <fieldset className="space-y-5">
                            <legend className="sr-only">Assessment Options</legend>
                            {assessmentsOptions.map((option: any) => {
                                const id = option.title.toLowerCase().split(' ').join('-');

                                return (
                                    <div key={option.id} className="relative flex items-start">
                                        <div className="flex h-5 items-center">
                                            <input
                                                id={id}
                                                aria-describedby={`${id}-description`}
                                                name={id}
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-cues-blue focus:ring-cues-blue"
                                            />
                                        </div>
                                        <div className="ml-3 text-sm">
                                            <label htmlFor={id} className="font-medium text-gray-700">
                                                {option.title}
                                            </label>
                                            <p id={`${id}-description`} className="text-gray-500">
                                                {option.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </fieldset>
                    </div>

                    <div className="mb-12 flex flex-col w-full">
                        <div className="flex items-center w-full border-b border-cues-gray py-2">
                            <Apps01Icon class="w-6 h-6" />
                            <div className="ml-2 text-base font-medium text-gray-900 dark:text-white">Apps</div>
                        </div>
                        <ul className="mt-5">
                            {cuesAppOptions.map((app: any) => {
                                return (
                                    <li key={app.id} className="flex items-center py-4">
                                        <div
                                            className={classNames(
                                                'flex h-10 w-10 flex-none items-center justify-center rounded-lg',
                                                app.background
                                            )}
                                        >
                                            <app.icon className="h-6 w-6 text-white" aria-hidden="true" />
                                        </div>
                                        <div className="ml-4 flex-auto">
                                            <p className={classNames('text-sm font-medium text-gray-900')}>
                                                {app.title}
                                            </p>
                                            <p
                                                className={classNames(
                                                    'text-sm',
                                                    true ? 'text-gray-700' : 'text-gray-500'
                                                )}
                                            >
                                                {app.description}
                                            </p>
                                        </div>
                                        <div className="ml-4">
                                            <button
                                                type="button"
                                                className={classNames(
                                                    // selectedIntegrations.includes(integration.id)
                                                    false ? 'bg-blue-800 dark:bg-blue-700' : 'bg-cues-blue',
                                                    'text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-1.5 focus:outline-none dark:focus:ring-blue-800'
                                                )}
                                                onClick={() => {
                                                    // if (selectedIntegrations.includes(integration.id)) {
                                                    //     const filterIntegrations = selectedIntegrations.filter(
                                                    //         (selected) => selected !== integration.id
                                                    //     );
                                                    //     setSelectedIntegrations(filterIntegrations);
                                                    // } else {
                                                    //     const updateIntegrations = [...selectedIntegrations];
                                                    //     updateIntegrations.push(integration.id);
                                                    //     setSelectedIntegrations(updateIntegrations);
                                                    // }
                                                }}
                                            >
                                                {/* {selectedIntegrations.includes(integration.id) ? 'Added' : 'Add'} */}
                                                Add
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            );
        } else if (currentStep === 4) {
            return (
                <div className="w-full lg:max-w-3xl">
                    <div class="flex">
                        {/* <label
                            for="search-dropdown"
                            class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-gray-300"
                        >
                            Your Email
                        </label> */}
                        <button
                            id="dropdown-button"
                            data-dropdown-toggle="dropdown"
                            class="flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center text-gray-900 bg-gray-100 border border-gray-300 rounded-l-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700 dark:text-white dark:border-gray-600"
                            type="button"
                        >
                            All categories{' '}
                            <svg
                                aria-hidden="true"
                                class="ml-1 w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clip-rule="evenodd"
                                ></path>
                            </svg>
                        </button>
                        {/* <div
                            id="dropdown"
                            class="hidden z-10 w-44 bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700"
                            data-popper-reference-hidden=""
                            data-popper-escaped=""
                            data-popper-placement="top"
                            style="position: absolute; inset: auto auto 0px 0px; margin: 0px; transform: translate3d(897px, 5637px, 0px);"
                        >
                            <ul class="py-1 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdown-button">
                                <li>
                                    <button
                                        type="button"
                                        class="inline-flex py-2 px-4 w-full hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                                    >
                                        Mockups
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        class="inline-flex py-2 px-4 w-full hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                                    >
                                        Templates
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        class="inline-flex py-2 px-4 w-full hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                                    >
                                        Design
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        class="inline-flex py-2 px-4 w-full hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                                    >
                                        Logos
                                    </button>
                                </li>
                            </ul>
                        </div> */}
                        <div class="relative w-full">
                            <input
                                type="search"
                                id="search-dropdown"
                                class="block p-2.5 w-full z-20 text-sm text-gray-900 bg-gray-50 rounded-r-lg border-l-gray-50 border-l-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-l-gray-700  dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500"
                                placeholder="Search title, category, subject..."
                            />
                            <button
                                type="submit"
                                class="absolute top-0 right-0 p-2.5 text-sm font-medium text-white bg-cues-blue rounded-r-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-cues-blue dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                            >
                                <svg
                                    aria-hidden="true"
                                    class="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    ></path>
                                </svg>
                                <span class="sr-only">Search</span>
                            </button>
                        </div>
                    </div>

                    {renderIntegrationsList()}
                </div>
            );
        } else if (currentStep === 5)
            return (
                <div className="w-full lg:max-w-3xl">
                    <div className="mb-6">
                        <div className="flex justify-between items-center w-full mb-4">
                            <label
                                htmlFor="message"
                                className="block text-sm font-medium text-gray-900 dark:text-white"
                            >
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
                        <label
                            htmlFor="message"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
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
                </div>
            );
    };

    const renderCreateCourseButtons = () => {
        return (
            <div className="flex flex-row justify-end border-t border-cues-border pt-4">
                {currentStep !== 1 && (
                    <button
                        type="button"
                        className="inline-flex mr-4 items-center rounded-md border border-cues-border dark:border-cues-border-dark bg-white dark:bg-cues-dark-3 px-6 py-2.5 text-sm font-medium text-black dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none dark:hover:border-white"
                        onClick={() => handlePrevious()}
                    >
                        Previous
                    </button>
                )}
                <button
                    type="submit"
                    className="inline-flex mr-4 items-center rounded-md border border-transparent bg-cues-blue px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none"
                >
                    Next
                </button>
            </div>
        );
    };

    const handlePrevious = () => {
        setCurrentStep(currentStep - 1);

        var myDiv = document.getElementById('MainContainer');
        if (myDiv) {
            myDiv.scrollTop = 0;
        }
    };

    const handleSubmit = () => {
        // Check if everything has been filled out

        // Update current step as complete

        const updateCourseSteps = newCourseSteps.map((step: any) => {
            if (step.id === currentStep) {
                return {
                    ...step,
                    status: 'complete',
                };
            } else {
                return {
                    ...step,
                };
            }
        });

        setNewCourseSteps(updateCourseSteps);

        // Submit
        if (currentStep === 6) {
        } else {
            setCurrentStep(currentStep + 1);
        }

        var myDiv = document.getElementById('MainContainer');
        if (myDiv) {
            myDiv.scrollTop = 0;
        }
    };

    return (
        <div className="flex flex-col flex-1 w-full relative">
            <div className="bg-white dark:bg-cues-dark-2 sticky top-0 z-50 flex h-14 border-b border-cues-border dark:border-cues-border-dark dark:bg-cues-dark-2 flex-shrink-0">
                {/* Back Arrow */}
                <button
                    type="button"
                    className="px-8 text-gray-500 dark:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cues-blue"
                    // onClick={() => closeEventForm()}
                >
                    <span className="sr-only">Back to Home</span>
                    <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                {/* Main */}
                <div className="flex flex-1 justify-between px-4">
                    <div className="flex items-center flex-1">
                        <h1 className="text-2xl font-bold text-black dark:text-white">New Course</h1>
                    </div>
                </div>
            </div>

            <form
                className="w-full px-4 sm:px-6 lg:px-8 mb-12"
                onSubmit={(e) => {
                    e.preventDefault();

                    handleSubmit();
                }}
            >
                <ol
                    role="list"
                    className="mt-4 w-full list-none divide-y divide-gray-300 rounded-md md:flex md:divide-y-0 "
                >
                    {newCourseSteps.map((step, stepIdx) => (
                        <li key={step.id} className="relative md:flex items-center">
                            {step.id === currentStep ? (
                                <div className="flex items-center pr-4 py-4 text-sm font-medium" aria-current="step">
                                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-cues-blue">
                                        <span className="text-cues-blue">{step.id}</span>
                                    </span>
                                    <span className="ml-4 text-sm font-medium text-black dark:text-white">
                                        {step.name}
                                    </span>
                                </div>
                            ) : step.status === 'complete' ? (
                                <div className="group flex items-center">
                                    <span className="flex items-center pr-4 py-4 text-sm font-medium">
                                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-cues-blue group-hover:bg-blue-800">
                                            <CheckIcon className="h-6 w-6 text-white" aria-hidden="true" />
                                        </span>
                                        <span className="ml-4 text-sm font-medium text-gray-900">{step.name}</span>
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center pr-4 py-4 text-sm font-medium">
                                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
                                        <span className="text-gray-500 group-hover:text-gray-900">{step.id}</span>
                                    </span>
                                    <span className="ml-4 text-sm font-medium text-gray-500 group-hover:text-gray-900">
                                        {step.name}
                                    </span>
                                </div>
                            )}

                            {stepIdx !== newCourseSteps.length - 1 ? (
                                <>
                                    {/* Arrow separator for lg screens and up */}
                                    <div className="md:block mr-4" aria-hidden="true">
                                        <ChevronRightIcon className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                                    </div>
                                </>
                            ) : null}
                        </li>
                    ))}
                </ol>
                {/*  */}
                <div className="w-full mt-8">{renderActiveCourseHeader()}</div>
                <div className="w-full mt-8">{renderActiveCourseTab()}</div>
                <div className="w-full mt-8">{renderCreateCourseButtons()}</div>
            </form>
        </div>
    );
};

export default NewCourse;
