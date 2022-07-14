import { StackScreenProps } from '@react-navigation/stack';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text } from '../components/Themed';
import { Platform } from 'react-native';
import {
    fetchAnnotationsForViewer,
    updateAnnotationsFromViewer,
    getUsernamesForAnnotation,
} from '../graphql/QueriesAndMutations';
import WebViewer from '@pdftron/pdfjs-express';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useApolloClient } from '@apollo/client';

export default function PDFViewerCues({ navigation, route }: StackScreenProps<any, 'pdfviewer'>) {
    const server = useApolloClient();
    const [invalidParams, setInvalidParams] = useState(false);
    const [url, setUrl] = useState('');
    const [cueId, setCueId] = useState('');
    const [userId, setUserId] = useState('');
    // User Id
    const [annotations, setAnnotations] = useState('');
    const [source, setSource] = useState('');
    const [name, setName] = useState('');
    const [feedbackUser, setFeedbackUser] = useState('');
    const [releaseSubmission, setReleaseSubmission] = useState(false);
    const RichText: any = useRef();
    const [loading, setLoading] = useState(true);
    const [usernamesForAnnotation, setUsernamesForAnnotation] = useState<any>({});

    useEffect(() => {
        if (Platform.OS === 'web') {
            // check URL over here

            const urlParam = route?.params?.url;
            const userIdParam = route?.params?.userId;
            const cueIdParam = route?.params?.cueId;
            const sourceParam = route?.params?.source;
            const nameParam = route?.params?.name;
            const feedbackUserParam = route?.params?.feedbackUser;

            if (!urlParam || !sourceParam) {
                setInvalidParams(true);
                return;
            } else {
                setInvalidParams(false);
            }

            setUrl(urlParam);
            setCueId(cueIdParam);
            setUserId(userIdParam);
            setSource(sourceParam);
            setName(decodeURIComponent(nameParam));
            setFeedbackUser(decodeURIComponent(feedbackUserParam));

            // console.log("UrlParam", urlParam)
            // console.log("Source", sourceParam)
            // console.log("CueId", cueIdParam)
            // console.log("UserId", userIdParam)
            // console.log("Source", sourceParam)
            // console.log("NameParam", nameParam)

            if (sourceParam === 'CREATE') {
                setLoading(false);
                return;
            } else if (sourceParam === 'UPDATE' || sourceParam === 'MY_NOTES') {
                server
                    .query({
                        query: fetchAnnotationsForViewer,
                        variables: {
                            cueId: cueIdParam,
                            userId: userIdParam,
                            myNotes: sourceParam === 'MY_NOTES',
                        },
                    })
                    .then(async (res) => {
                        if (
                            res.data &&
                            res.data.user.fetchAnnotationsForViewer !== undefined &&
                            res.data.user.fetchAnnotationsForViewer !== null
                        ) {
                            const annot = res.data.user.fetchAnnotationsForViewer.annotations
                                ? res.data.user.fetchAnnotationsForViewer.annotations
                                : '';

                            setAnnotations(annot ? annot : '');
                        } else {
                            // No cue attached to URL so then don't render file
                            setInvalidParams(true);
                        }
                        setLoading(false);
                    })
                    .catch((err) => {
                        console.log('Error in fetching params', err);
                        setLoading(false);
                        setInvalidParams(true);
                        console.log(err);
                    });
            } else if (
                sourceParam === 'CREATE_SUBMISSION' ||
                sourceParam === 'VIEW_SUBMISSION' ||
                sourceParam === 'FEEDBACK'
            ) {
                //
                server
                    .query({
                        query: fetchAnnotationsForViewer,
                        variables: {
                            cueId: cueIdParam,
                            userId: userIdParam,
                        },
                    })
                    .then(async (res) => {
                        if (
                            res.data &&
                            res.data.user.fetchAnnotationsForViewer !== undefined &&
                            res.data.user.fetchAnnotationsForViewer !== null
                        ) {
                            const cue = res.data.user.fetchAnnotationsForViewer.cue;

                            if (cue && cue[0] && cue[0] === '{' && cue[cue.length - 1] === '}') {
                                const obj = JSON.parse(cue);

                                if (sourceParam === 'CREATE_SUBMISSION') {
                                    const submissionDraft = obj.submissionDraft;

                                    setAnnotations(submissionDraft.annotations ? submissionDraft.annotations : '');
                                } else {
                                    const attempts = obj.attempts;

                                    const currAttempt = attempts.filter((attempt: any) => attempt.isActive)[0];

                                    setAnnotations(currAttempt.annotations ? currAttempt.annotations : '');
                                }
                            }

                            setReleaseSubmission(
                                res.data.user.fetchAnnotationsForViewer.releaseSubmission ? true : false
                            );
                        } else {
                            // No cue attached to URL so then don't render file
                            setInvalidParams(true);
                        }
                        setLoading(false);
                    })
                    .catch((err) => {
                        console.log(err);
                        setInvalidParams(true);
                        setLoading(false);
                    });

                if (sourceParam === 'VIEW_SUBMISSION' || sourceParam === 'FEEDBACK') {
                    server
                        .query({
                            query: getUsernamesForAnnotation,
                            variables: {
                                cueId: cueIdParam,
                            },
                        })
                        .then((res) => {
                            if (res.data && res.data.user.getUsernamesForAnnotation) {
                                const userIdToNameMap = JSON.parse(res.data.user.getUsernamesForAnnotation);
                                setUsernamesForAnnotation(userIdToNameMap);
                            }
                        })
                        .catch((e) => {});
                }
            }
        } else {
            setInvalidParams(true);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!url || loading) {
            return;
        }

        WebViewer(
            {
                licenseKey: 'xswED5JutJBccg0DZhBM',
                initialDoc: url,
                enableReadOnlyMode:
                    source === 'CREATE' ||
                    (source === 'VIEW_SUBMISSION' && !releaseSubmission) ||
                    source === 'CREATE_SUBMISSION',
                annotationUser: source === 'FEEDBACK' ? feedbackUser : userId,
            },
            RichText.current
        ).then(async (instance: any) => {
            // FOR CREATE NO NEED TO LOAD ANNOTATIONS

            if (source === 'CREATE') {
                return;
            }
            const { documentViewer, annotationManager } = instance.Core;

            if (!documentViewer || !annotationManager) return;

            // you can now call WebViewer APIs here...
            documentViewer.addEventListener('documentLoaded', async () => {
                // const currCue = subCues[props.cueKey][props.cueIndex];

                if (annotations !== '') {
                    const xfdfString = annotations;

                    annotationManager.importAnnotations(xfdfString).then((annot: any) => {
                        annot.forEach((annotation: any) => {
                            console.log('Annotation', annotation);
                            if (source === 'VIEW_SUBMISSION') {
                                // Hide instructor annotations until grades are released
                                if (!releaseSubmission && annotation.Author !== userId) {
                                    annotationManager.hideAnnotation(annotation);
                                } else {
                                    annotationManager.redrawAnnotation(annotation);
                                }
                            } else {
                                annotationManager.redrawAnnotation(annotation);
                            }
                        });
                    });
                }
            });

            annotationManager.setAnnotationDisplayAuthorMap((id: string) => {
                console.log('ID', id);
                console.log('User Id', userId);
                if (source !== 'FEEDBACK' && userId === id) {
                    return name;
                } else if (source === 'FEEDBACK' && feedbackUser === id) {
                    return name;
                } else if (usernamesForAnnotation[id] && usernamesForAnnotation[id] !== undefined) {
                    return usernamesForAnnotation[id];
                } else {
                    // Fetch username from server and add it to the Map
                    return 'no name';
                }
            });

            annotationManager.addEventListener(
                'annotationChanged',
                async (annotations: any, action: any, { imported }) => {
                    // If the event is triggered by importing then it can be ignored
                    // This will happen when importing the initial annotations
                    // from the server or individual changes from other users
                    if (imported) return;

                    const xfdfString = await annotationManager.exportAnnotations({ useDisplayAuthor: false });

                    server
                        .mutate({
                            mutation: updateAnnotationsFromViewer,
                            variables: {
                                userId,
                                cueId,
                                annotations: xfdfString,
                                source,
                            },
                        })
                        .then((res: any) => {
                            if (res.data && res.data.user.updateAnnotationsFromViewer) {
                                console.log('Success');
                            } else {
                                console.log('Error');
                            }
                        });
                }
            );
        });
    }, [
        url,
        RichText,
        cueId,
        userId,
        annotations,
        source,
        name,
        releaseSubmission,
        loading,
        usernamesForAnnotation,
        feedbackUser,
    ]);

    console.log('Annotations', annotations);

    if (loading) {
        return (
            <View
                style={{
                    width: '100%',
                    height: '100%',
                    // backgroundColor: '#f8f8f8',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <ActivityIndicator color={'#1F1F1F'} />
            </View>
        );
    }

    if (invalidParams) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Could not fetch file.</Text>
            </View>
        );
    }

    return (
        <View
            style={{ width: '100%', height: '100%' }}
            key={JSON.stringify(url) + JSON.stringify(annotations) + name + JSON.stringify(usernamesForAnnotation)}
        >
            <div className="webviewer" ref={RichText} style={{ height: '100vh' }}></div>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontFamily: 'inter',
    },
    link: {
        marginTop: 15,
        paddingVertical: 15,
    },
    linkText: {
        fontSize: 14,
        color: '#f9c74f',
    },
});
