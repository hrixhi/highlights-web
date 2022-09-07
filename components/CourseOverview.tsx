// REACT
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCourseContext } from '../contexts/CourseContext';

import FroalaEditor from 'react-froala-wysiwyg';
import Froalaeditor from 'froala-editor';

import { useAppContext } from '../contexts/AppContext';
import { useNavigationContext } from '../contexts/NavigationContext';

// Require Editor JS files.
import 'froala-editor/js/froala_editor.pkgd.min.js';
import 'froala-editor/js/plugins.pkgd.min.js';
// Require Editor CSS files.
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';
// Require Font Awesome.
import 'font-awesome/css/font-awesome.css';
import { courseOverviewHtmlTemplate } from '../constants/CourseTemplate';

const CourseOverview: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { courseData } = useCourseContext();
    const [courseName, setCourseName] = useState('');
    const { theme } = useNavigationContext();
    const [courseOverviewHtml, setCourseOverviewHtml] = useState(courseOverviewHtmlTemplate);

    const { userId } = useAppContext();

    const editorRef = useRef();

    console.log('Course Overview Html', courseOverviewHtml);

    const coverImages = {
        art: 'https://www.notion.so/images/page-cover/rijksmuseum_avercamp_1608.jpg',
        history:
            'https://images.unsplash.com/photo-1479142506502-19b3a3b7ff33?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2340&q=80',
        math: 'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2348&q=80',
        ela: 'https://images.unsplash.com/photo-1519682577862-22b62b24e493?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2340&q=80',
        default:
            'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2340&q=80',
    };

    const getCoverImgUrl = () => {
        if (!courseData) return '';

        console.log('Course Data', courseData);

        if (coverImages[courseData.channelName.toLowerCase()]) {
            return coverImages[courseData.channelName.toLowerCase()];
        } else {
            return coverImages['default'];
        }
    };

    useEffect(() => {
        setCourseName(courseData.channelName);
    }, [courseData]);

    return (
        <div className="flex flex-1 flex-col w-full">
            {/* Cover photo */}
            <div className="w-full relative hidden overflow-hidden lg:block">
                <img className="relative w-full h-full max-h-64 object-cover" src={getCoverImgUrl()} alt="" />
                <label
                    htmlFor="desktop-user-photo"
                    className="absolute inset-0 flex h-full w-full items-center justify-center bg-black bg-opacity-75 text-sm font-medium text-white opacity-0 focus-within:opacity-100 hover:opacity-100"
                >
                    <span>Change Cover</span>
                    <span className="sr-only"> user photo</span>
                    <input
                        type="file"
                        id="desktop-user-photo"
                        name="user-photo"
                        className="absolute inset-0 h-full w-full cursor-pointer border-gray-300 opacity-0"
                    />
                </label>
            </div>
            {/* Name of Course */}
            <div className="w-full flex justify-center my-6">
                <div className="w-full flex flex-col items-center md:max-w-3xl">
                    <input
                        className="w-full text-5xl font-bold flex-1 bg-white dark:bg-cues-dark-3 text-gray-900 dark:text-white"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                    />

                    {/* FROALA EDITOR FOR LINKS */}
                    <div className="w-full mt-8 dark:fr-dark-view">
                        <FroalaEditor
                            ref={editorRef}
                            model={courseOverviewHtml}
                            onModelChange={(model: any) => setCourseOverviewHtml(model)}
                            config={{
                                toolbarInline: true,
                                key: 'kRB4zB3D2D2E1B2A1B1rXYb1VPUGRHYZNRJd1JVOOb1HAc1zG2B1A2A2D6B1C1C4E1G4==',
                                attribution: false,
                                placeholderText: 'Course Overview',
                                charCounterCount: false,
                                // immediateReactModelUpdate: true,
                                heightMin: 300,
                                fileUpload: false,
                                videoUpload: false,
                                imageUploadURL: 'https://api.learnwithcues.com/api/imageUploadEditor',
                                imageUploadParam: 'file',
                                imageUploadParams: { userId },
                                imageUploadMethod: 'POST',
                                imageMaxSize: 5 * 1024 * 1024,
                                imageAllowedTypes: ['jpeg', 'jpg', 'png'],
                                // Default Font Size
                                spellcheck: true,
                                tabSpaces: 4,
                                // TOOLBAR
                                toolbarSticky: false,
                                quickInsertEnabled: true,
                                theme: theme === 'dark' ? 'dark' : 'royal',
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseOverview;
