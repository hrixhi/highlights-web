import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
// import { TextInput as CustomTextInput } from './CustomTextInput'
import { Text, View } from './Themed';
// import EquationEditor from 'equation-editor-react';
import TextareaAutosize from 'react-textarea-autosize';
import { RadioButton } from './RadioButton';
import parser from 'html-react-parser';

import ReactPlayer from 'react-player';
import { Ionicons } from '@expo/vector-icons';

import ImageMarker from 'react-image-marker';

import ReactHtmlParser, { convertNodeToElement } from 'react-html-parser';
import MathJax from 'react-mathjax-preview';
import { disableEmailId } from '../constants/zoomCredentials';
import { paddingResponsive } from '../helpers/paddingHelper';

const Quiz: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [problems] = useState<any[]>(props.problems);
    const [solutions, setSolutions] = useState<any[]>(props.solutions.solutions);
    const [problemScores, setProblemScores] = useState<any[]>(props.solutions.problemScores);
    const [problemComments, setProblemComments] = useState<any[]>(
        props.solutions.problemComments ? props.solutions.problemComments : []
    );
    const [totalPossible, setTotalPossible] = useState(0);
    const [currentScore, setCurrentScore] = useState(0);
    const [percentage, setPercentage] = useState('');
    const [comment, setComment] = useState(props.comment ? props.comment : '');
    const [headers, setHeaders] = useState<any>(props.headers);

    console.log('Solutions', solutions);
    console.log('Props', props);

    if (!props.solutions) {
        return null;
    }

    // HOOKS

    /**
     * @description Set headers from Props
     */
    useEffect(() => {
        setHeaders(props.headers);
    }, [props.headers]);

    /**
     * @description Loads Scores and Comments from props
     */
    useEffect(() => {
        let currentScore = 0;
        props.solutions.problemScores.forEach((score: any) => {
            currentScore += Number(score);
        });
        setCurrentScore(currentScore);
        setSolutions(props.solutions.solutions);
        setProblemScores(props.solutions.problemScores);
        setProblemComments(props.solutions.problemComments ? props.solutions.problemComments : []);

        if (props.solutions.solutions && !props.solutions.problemComments) {
            let comments: any[] = [];
            props.solutions.solutions.forEach((sol: any) => comments.push(''));
            setProblemComments(comments);
        }
    }, [props.solutions]);

    /**
     * @description Calculates total possible score for quiz
     */
    useEffect(() => {
        let total = 0;
        props.problems.forEach((problem: any) => {
            total += problem.points;
        });
        setTotalPossible(total);
    }, [props.problems]);

    /**
     * @description Sets current score and calculates percentage
     */
    useEffect(() => {
        let currentScore = 0;
        problemScores.forEach((score: any) => {
            currentScore += Number(score);
        });

        setCurrentScore(currentScore);

        if (totalPossible === 0) return;

        setPercentage(((currentScore / totalPossible) * 100).toFixed(2));
    }, [problemScores, totalPossible]);

    // FUNCTIONS

    /**
     * @description Helper method to calculate time difference between two times
     */
    const diff_seconds = (dt2: any, dt1: any) => {
        const diff = dt2.getTime() - dt1.getTime();

        const Seconds_from_T1_to_T2 = diff / 1000;
        return Math.abs(Seconds_from_T1_to_T2);
    };

    /**
     * @description Renders Audio/Video player
     */
    const renderAudioVideoPlayer = (url: string, type: string) => {
        return (
            <ReactPlayer
                url={url}
                controls={true}
                width={'100%'}
                height={type === 'mp3' || type === 'wav' ? '75px' : '360px'}
                onContextMenu={(e: any) => e.preventDefault()}
                config={{
                    file: { attributes: { controlsList: 'nodownload' } },
                }}
            />
        );
    };

    /**
     * @description Renders Attempt history for Quiz
     */
    const renderAttemptHistory = () => {
        return (
            <View
                style={{
                    width: Dimensions.get('window').width < 1024 ? '100%' : '60%',
                    marginTop: 40,
                    marginBottom: 80,
                }}
            >
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Attempt History</Text>
                </View>
                <View style={styles.row}>
                    <View
                        style={{
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: 7,
                            width: props.isOwner ? '20%' : '25%',
                        }}
                    />
                    <View
                        style={{
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: 7,
                            width: props.isOwner ? '20%' : '25%',
                        }}
                    >
                        <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14, fontWeight: 'bold' }}>
                            Attempt
                        </Text>
                    </View>
                    <View
                        style={{
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: 7,
                            width: props.isOwner ? '20%' : '25%',
                        }}
                    >
                        <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14, fontWeight: 'bold' }}>
                            Time
                        </Text>
                    </View>
                    <View
                        style={{
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: 7,
                            width: props.isOwner ? '20%' : '25%',
                        }}
                    >
                        <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14, fontWeight: 'bold' }}>
                            Score
                        </Text>
                    </View>
                    {props.isOwner ? (
                        <View
                            style={{
                                justifyContent: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                padding: 7,
                                width: props.isOwner ? '20%' : '25%',
                            }}
                        >
                            <Text
                                style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14, fontWeight: 'bold' }}
                            >
                                Status
                            </Text>
                        </View>
                    ) : null}
                </View>
                {props.attempts.map((attempt: any, index: number) => {
                    let duration =
                        attempt.initiatedAt !== null
                            ? diff_seconds(new Date(attempt.submittedAt), new Date(attempt.initiatedAt))
                            : 0;

                    let hours = duration !== 0 ? Math.floor(duration / 3600) : 0;

                    let minutes = duration !== 0 ? Math.floor((duration - hours * 3600) / 60) : 0;

                    let seconds = duration !== 0 ? Math.ceil(duration - hours * 3600 - minutes * 60) : 0;

                    return (
                        <View key={index.toString()} style={styles.row}>
                            <View
                                style={{
                                    justifyContent: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: 7,
                                    width: props.isOwner ? '20%' : '25%',
                                }}
                            >
                                {attempt.isActive ? (
                                    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons
                                            name="checkmark-outline"
                                            size={Dimensions.get('window').width < 768 ? 23 : 18}
                                            color={'#53BE68'}
                                        />
                                        <Text
                                            style={{
                                                fontSize: Dimensions.get('window').width < 768 ? 13 : 14,
                                                paddingLeft: 5,
                                            }}
                                        >
                                            KEPT
                                        </Text>
                                    </View>
                                ) : null}
                            </View>
                            <View
                                style={{
                                    justifyContent: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: 7,
                                    width: props.isOwner ? '20%' : '25%',
                                }}
                            >
                                {props.isOwner ? (
                                    <TouchableOpacity onPress={() => props.onChangeQuizAttempt(index)}>
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                color: '#000',
                                                fontFamily: 'Inter',
                                            }}
                                        >
                                            Attempt {index + 1}
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <Text style={{ fontSize: 16 }}>Attempt {index + 1}</Text>
                                )}
                            </View>
                            <View
                                style={{
                                    justifyContent: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: 7,
                                    width: props.isOwner ? '20%' : '25%',
                                }}
                            >
                                <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14 }}>
                                    {duration !== 0
                                        ? `${hours !== 0 ? '' + hours + ' H ' : ''} ${
                                              minutes !== 0 ? '' + minutes + ' min' : ''
                                          }  ${seconds !== 0 ? '' + seconds + ' sec' : ''}`
                                        : '-'}
                                </Text>
                            </View>
                            <View
                                style={{
                                    justifyContent: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: 7,
                                    width: props.isOwner ? '20%' : '25%',
                                }}
                            >
                                <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14 }}>
                                    {attempt.score} / {totalPossible}
                                </Text>
                            </View>
                            {props.isOwner ? (
                                <View
                                    style={{
                                        justifyContent: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        padding: 7,
                                        width: props.isOwner ? '20%' : '25%',
                                    }}
                                >
                                    <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14 }}>
                                        {attempt.isFullyGraded ? 'Graded' : 'Not Graded'}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    );
                })}
            </View>
        );
    };

    /**
     * @description Renders Header for question at index
     */
    const renderHeader = (index: number) => {
        if (index in headers) {
            return (
                <Text style={{ width: '100%', marginBottom: 30, marginTop: 70, fontSize: 18, fontWeight: '600' }}>
                    {headers[index]}
                </Text>
            );
        }
        return null;
    };

    if (props.loading)
        return (
            <View
                style={{
                    width: '100%',
                    flex: 1,
                    justifyContent: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#f8f8f8',
                }}
            >
                <ActivityIndicator color={'#1F1F1F'} />
            </View>
        );

    console.log('Solutions', solutions);

    // MAIN RETURN

    return (
        <View
            style={{
                width: '100%',
                backgroundColor: '#f8f8f8',
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                paddingTop: 15,
                paddingLeft: 0,
                flexDirection: 'column',
                justifyContent: 'flex-start',
            }}
        >
            {props.isOwner ? (
                <View
                    style={{
                        display: 'flex',
                        flexDirection: Dimensions.get('window').width < 1024 ? 'column' : 'row',
                        justifyContent: 'space-between',
                        marginBottom: 20,
                        borderBottomWidth: 1,
                        borderBottomColor: '#ccc',
                        width: '100%',
                    }}
                >
                    <View
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            marginBottom: Dimensions.get('window').width < 1024 ? 20 : 0,
                        }}
                    >
                        <Text style={{ marginRight: 10, fontWeight: '700', fontSize: 16 }}>
                            {props.problems.length} {props.problems.length === 1 ? 'Question' : 'Questions'}
                        </Text>
                        <Text style={{ marginRight: 10, fontWeight: '700', fontSize: 16 }}>{totalPossible} Points</Text>
                    </View>

                    <View style={{}}>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 10 }}>
                            <Text
                                style={{
                                    fontSize: 16,
                                    height: 22,
                                    fontFamily: 'Inter',
                                    paddingHorizontal: 10,
                                    borderRadius: 1,
                                    color: '#000',
                                    lineHeight: 20,
                                    paddingTop: 1,
                                }}
                            >
                                {percentage}%
                            </Text>
                            <Text
                                style={{
                                    fontSize: 16,
                                    height: 22,
                                    fontFamily: 'Inter',
                                    // textAlign: 'right',
                                    paddingHorizontal: 10,
                                    marginLeft: 10,
                                    borderRadius: 1,
                                    color: '#000',
                                    lineHeight: 20,
                                    paddingTop: 1,
                                }}
                            >
                                {currentScore}/{totalPossible}
                            </Text>
                            {props.isOwner ? (
                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontFamily: 'Inter',
                                        color: '#000000',
                                        marginBottom: 10,
                                        paddingLeft: 20,
                                        lineHeight: 22,
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {props.partiallyGraded ? 'In progress' : 'Graded'}
                                </Text>
                            ) : null}
                        </View>
                    </View>
                </View>
            ) : null}

            {renderAttemptHistory()}

            {props.isOwner ? (
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Attempt {props.currentQuizAttempt + 1}</Text>
                </View>
            ) : null}

            {props.problems.map((problem: any, index: any) => {
                let onlyOneCorrect = true;

                if (!problem.questionType) {
                    let noOfCorrect = 0;

                    problem.options.map((option: any) => {
                        if (option.isCorrect) noOfCorrect++;
                    });

                    if (noOfCorrect > 1) onlyOneCorrect = false;
                }

                let audioVideoQuestion =
                    problem.question[0] === '{' && problem.question[problem.question.length - 1] === '}';

                let url = '';
                let content = '';
                let type = '';

                if (audioVideoQuestion) {
                    const parse = JSON.parse(problem.question);

                    url = parse.url;
                    content = parse.content;
                    type = parse.type;
                }

                console.log('Problem', problem);

                return (
                    <View
                        style={{
                            borderBottomColor: '#ccc',
                            borderBottomWidth: index === props.problems.length - 1 ? 0 : 1,
                            marginBottom: 25,
                        }}
                        key={index}
                    >
                        {renderHeader(index)}
                        <View style={{ flexDirection: 'column', width: '100%' }}>
                            <View
                                style={{
                                    flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                                    width: '100%',
                                }}
                            >
                                <Text
                                    style={{
                                        color: '#000000',
                                        fontSize: 22,
                                        paddingBottom: 25,
                                        width: 40,
                                        paddingTop: 15,
                                        fontFamily: 'inter',
                                    }}
                                >
                                    {index + 1}.
                                </Text>

                                {/* Question */}
                                <View
                                    style={{
                                        flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                                        flex: 1,
                                    }}
                                >
                                    {/* Scoring */}
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'flex-start',
                                            paddingLeft: Dimensions.get('window').width >= 768 ? 20 : 0,
                                            marginBottom: Dimensions.get('window').width >= 768 ? 20 : 0,
                                            marginLeft: 'auto',
                                            paddingTop: 7,
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', marginRight: 20 }}>
                                            {!problem.required ? null : (
                                                <Text
                                                    style={{
                                                        fontSize: 20,
                                                        fontFamily: 'inter',
                                                        color: 'black',
                                                        marginBottom: 5,
                                                        marginRight: 10,
                                                        paddingTop: 10,
                                                    }}
                                                >
                                                    *
                                                </Text>
                                            )}
                                        </View>
                                        {!props.isOwner ? null : (
                                            <TextInput
                                                editable={props.isOwner ? true : false}
                                                value={problemScores[index]}
                                                onChange={(e: any) => {
                                                    if (Number.isNaN(Number(e.target.value))) return;
                                                    const updateProblemScores = [...problemScores];
                                                    updateProblemScores[index] = e.target.value;
                                                    if (Number(e.target.value) > Number(problem.points)) {
                                                        alert('Assigned score exceeds total points');
                                                    }
                                                    setProblemScores(updateProblemScores);
                                                }}
                                                style={{
                                                    width: 120,
                                                    borderColor: '#cccccc',
                                                    borderWidth: 1,
                                                    borderRadius: 2,
                                                    fontSize: 16,
                                                    padding: 15,
                                                    paddingTop: props.isOwner ? 10 : 7,
                                                    paddingBottom: 10,
                                                    // marginTop: 5,
                                                    height: 40,
                                                    backgroundColor: '#fff',
                                                }}
                                                placeholder={'Enter points'}
                                                placeholderTextColor={'#1F1F1F'}
                                            />
                                        )}
                                        {!props.isOwner ? null : (
                                            <TextInput
                                                editable={false}
                                                value={'/ ' + problem.points}
                                                style={{
                                                    width: 100,
                                                    fontSize: 16,
                                                    padding: 15,
                                                    paddingTop: props.isOwner ? 12 : 7,
                                                    paddingBottom: 12,
                                                    // marginTop: 5,
                                                    paddingRight: 30,
                                                    height: 40,
                                                }}
                                                placeholder={'Enter points'}
                                                placeholderTextColor={'#1F1F1F'}
                                            />
                                        )}
                                        {!props.isOwner ? (
                                            <Text
                                                style={{
                                                    fontSize: 16,
                                                    marginTop: 5,
                                                    marginBottom: 10,
                                                    paddingTop: props.isOwner ? 12 : 7,
                                                    paddingRight: 30,
                                                    textAlign: 'right',
                                                    fontFamily: 'Inter',
                                                }}
                                            >
                                                {Number(problemScores[index]).toFixed(1).replace(/\.0+$/, '')} /{' '}
                                                {Number(problem.points).toFixed(1).replace(/\.0+$/, '')}
                                            </Text>
                                        ) : null}
                                    </View>
                                    <View />
                                </View>
                            </View>
                        </View>

                        {audioVideoQuestion ? (
                            <View style={{ width: '100%', marginBottom: 10, paddingTop: 10, flex: 1 }}>
                                {renderAudioVideoPlayer(url, type)}
                                <Text
                                    style={{
                                        marginTop: 10,
                                        marginBottom: 20,
                                        marginLeft: 20,
                                        fontSize: 16,
                                        lineHeight: 25,
                                    }}
                                >
                                    {parser(content)}
                                </Text>
                            </View>
                        ) : (
                            <Text
                                style={{
                                    marginTop: 15,
                                    marginBottom: 20,
                                    marginLeft: 20,
                                    fontSize: 16,
                                    width: window.screen.width < 1024 ? '100%' : '80%',
                                    lineHeight: 25,
                                    flex: 1,
                                }}
                            >
                                {parser(problem.question)}
                            </Text>
                        )}

                        {(!problem.questionType || problem.questionType === 'trueFalse') &&
                            problem.options.map((option: any, i: any) => {
                                let selected = solutions[index].selected[i].isSelected;
                                let isCorrectAnswer = option.isCorrect;

                                let color = '#000000';
                                let background = 'none';

                                if (selected && isCorrectAnswer) {
                                    color = '#35ac78';
                                    background = '#d4f3e5';
                                } else if (selected && !isCorrectAnswer) {
                                    color = '#f94144';
                                    background = '#ffe6f3';
                                } else if (!selected && isCorrectAnswer) {
                                    // color = '#000'
                                    // background = '#e6f0ff';
                                    color = '#35ac78';
                                    background = '#d4f3e5';
                                }

                                return (
                                    <View
                                        style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}
                                        key={solutions.toString() + i.toString()}
                                    >
                                        <View style={{ paddingRight: 10 }}>
                                            {onlyOneCorrect ? (
                                                <TouchableOpacity
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        flexDirection: 'row',
                                                    }}
                                                    disabled={true}
                                                >
                                                    <RadioButton selected={solutions[index].selected[i].isSelected} />
                                                </TouchableOpacity>
                                            ) : (
                                                <input
                                                    disabled={true}
                                                    style={{ paddingRight: 25, backgroundColor: '#fff' }}
                                                    type="checkbox"
                                                    checked={solutions[index].selected[i].isSelected}
                                                />
                                            )}
                                        </View>

                                        <Text
                                            style={{
                                                width: Dimensions.get('window').width < 768 ? '80%' : '50%',
                                                fontSize: 16,
                                                paddingHorizontal: 15,
                                                color,
                                                lineHeight: 25,
                                                backgroundColor: selected || isCorrectAnswer ? background : '#f8f8f8',
                                                borderColor: selected || isCorrectAnswer ? color : 'none',
                                                borderWidth: selected || isCorrectAnswer ? 1 : 0,
                                                padding: 7,
                                                borderRadius: 5,
                                            }}
                                        >
                                            {parser(option.option)}
                                        </Text>

                                        {selected || isCorrectAnswer ? (
                                            <Text
                                                style={{
                                                    fontSize: 16,
                                                    fontFamily: 'Overpass',
                                                    paddingLeft: 15,
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                {selected && isCorrectAnswer
                                                    ? 'Correct response'
                                                    : selected && !isCorrectAnswer
                                                    ? props.isOwner
                                                        ? 'Student response'
                                                        : 'Your response'
                                                    : 'Missing Correct answer'}
                                            </Text>
                                        ) : null}
                                    </View>
                                );
                            })}
                        {problem.questionType === 'freeResponse' ? (
                            <View
                                style={{
                                    width: '100%',
                                    paddingHorizontal: 25,
                                    borderColor: '#cccccc',
                                    borderWidth: 1,
                                    borderRadius: 2,
                                    backgroundColor: '#fff',
                                    // borderRadius: 12,
                                }}
                            >
                                <Text
                                    style={{
                                        color: solutions[index].response !== '' ? 'black' : '#f94144',
                                        paddingTop: 20,
                                        paddingBottom: 40,
                                        lineHeight: 25,
                                    }}
                                >
                                    {solutions[index].response && solutions[index].response !== ''
                                        ? parser(solutions[index].response)
                                        : 'No response'}
                                </Text>
                            </View>
                        ) : null}

                        {problem.questionType === 'highlightText' ? (
                            <View style={{ paddingTop: 20, paddingBottom: 30 }}>
                                {ReactHtmlParser(problem.highlightTextHtml, {
                                    transform: (node: any, ind1: any) => {
                                        if (node.type === 'tag' && node.name === 'p') {
                                            node.attribs.style = 'line-height: 40px';

                                            const highlightTextChoices = problem.highlightTextChoices;
                                            const highlightTextSelection = solutions[index].highlightTextSelection;

                                            return convertNodeToElement(node, ind1, (node: any, ind2: any) => {
                                                if (node.type === 'tag' && node.name === 'span') {
                                                    if (!node.attribs.id) {
                                                        return <span>{node.children[0].data}</span>;
                                                    }

                                                    let classNameHighlight = 'highlightTextOption';

                                                    if (
                                                        highlightTextSelection[Number(node.attribs.id)] &&
                                                        !highlightTextChoices[Number(node.attribs.id)]
                                                    ) {
                                                        classNameHighlight = 'highlightTextWrong';
                                                    } else if (
                                                        highlightTextSelection[Number(node.attribs.id)] &&
                                                        highlightTextChoices[Number(node.attribs.id)]
                                                    ) {
                                                        classNameHighlight = 'highlightTextCorrect';
                                                    } else if (
                                                        !highlightTextSelection[Number(node.attribs.id)] &&
                                                        highlightTextChoices[Number(node.attribs.id)]
                                                    ) {
                                                        classNameHighlight = 'highlightTextActive';
                                                    }

                                                    return (
                                                        <span className={classNameHighlight}>
                                                            {node.children[0].data}
                                                        </span>
                                                    );
                                                }
                                            });
                                        }
                                    },
                                })}
                            </View>
                        ) : null}

                        {problem.questionType === 'dragdrop' ? (
                            <div
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    paddingTop: 20,
                                }}
                            >
                                {problem.dragDropHeaders.map((header: string, groupIndex: number) => {
                                    //
                                    return (
                                        <View
                                            key={groupIndex.toString()}
                                            style={{
                                                width: 240,
                                                marginRight: 30,
                                                padding: 20,
                                                borderWidth: 1,
                                                borderColor: '#ccc',
                                                borderRadius: 15,
                                                marginBottom: 15,
                                                backgroundColor: '#fff',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 16,
                                                    width: '100%',
                                                    textAlign: 'center',
                                                    marginBottom: 20,
                                                    fontFamily: 'Inter',
                                                }}
                                            >
                                                {header}
                                            </Text>

                                            {solutions[index].dragDropChoices[groupIndex].map(
                                                (label: any, ind: number) => {
                                                    return (
                                                        <View
                                                            style={{
                                                                width: 200,
                                                                display: 'flex',
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                paddingVertical: 16,
                                                                paddingHorizontal: 10,
                                                                marginRight: 20,
                                                                marginBottom: 20,
                                                                borderRadius: 10,
                                                                // backgroundColor: '#f8f8f8',
                                                                borderWidth: 1,
                                                                borderColor: '#ccc',
                                                                shadowOffset: {
                                                                    width: 2,
                                                                    height: 2,
                                                                },
                                                                overflow: 'hidden',
                                                                shadowOpacity: 0.07,
                                                                shadowRadius: 7,
                                                            }}
                                                            key={ind.toString()}
                                                        >
                                                            <Ionicons
                                                                name={'ellipsis-vertical-outline'}
                                                                size={16}
                                                                color="#1f1f1f"
                                                            />
                                                            <Text
                                                                style={{
                                                                    width: '100%',
                                                                    marginLeft: 5,
                                                                }}
                                                            >
                                                                {label.content}
                                                            </Text>
                                                            <Ionicons
                                                                name={
                                                                    label.correct
                                                                        ? 'checkmark-circle-outline'
                                                                        : 'close-circle-outline'
                                                                }
                                                                size={16}
                                                                color={label.correct ? '#35AC78' : '#ff0000'}
                                                            />
                                                        </View>
                                                    );
                                                }
                                            )}
                                        </View>
                                    );
                                })}
                            </div>
                        ) : null}

                        {/* Hotspot Image marker */}

                        {problem.questionType === 'hotspot' ? (
                            <View
                                style={{
                                    width: '100%',
                                    paddingLeft: 40,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                }}
                            >
                                <View
                                    style={{
                                        maxWidth: Dimensions.get('window').width < 768 ? 300 : 600,
                                        maxHeight: Dimensions.get('window').width < 768 ? 300 : 600,
                                    }}
                                >
                                    <ImageMarker
                                        src={problem.imgUrl}
                                        markers={problem.hotspots.map((spot: any) => {
                                            return { top: spot.y, left: spot.x };
                                        })}
                                        onAddMarker={(marker: any) => {
                                            return;
                                        }}
                                        markerComponent={(p: any) => {
                                            const isSelected = solutions[index].hotspotSelection[p.itemNumber];
                                            const optionIsCorrect = problem.hotspotOptions[p.itemNumber].isCorrect;

                                            let backgroundColor = '#fff';
                                            let borderColor = '#007AFF';
                                            let color = '#007AFF';

                                            if (isSelected && !optionIsCorrect) {
                                                backgroundColor = '#ffe6f3';
                                                borderColor = '#f94144';
                                                color = '#f94144';
                                            } else if (isSelected && optionIsCorrect) {
                                                backgroundColor = '#d4f3e5';
                                                borderColor = '#35ac78';
                                                color = '#35ac78';
                                            } else if (!isSelected && optionIsCorrect) {
                                                backgroundColor = '#007AFF';
                                                borderColor = '#007AFF';
                                                color = '#fff';
                                            }

                                            return (
                                                <TouchableOpacity
                                                    key={p.itemNumber}
                                                    disabled={true}
                                                    style={{
                                                        backgroundColor,
                                                        height: 25,
                                                        width: 25,
                                                        borderColor,
                                                        borderWidth: 1,
                                                        borderRadius: 12.5,
                                                    }}
                                                    onPress={() => {
                                                        return;
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color,
                                                            lineHeight: 25,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {p.itemNumber + 1}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        }}
                                    />
                                </View>
                            </View>
                        ) : null}

                        {/* Hotspot Labels */}

                        {problem.questionType === 'hotspot' ? (
                            <View
                                style={{
                                    paddingTop: 50,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {problem.hotspotOptions.map((option: any, ind: number) => {
                                        const isSelected = solutions[index].hotspotSelection[ind];

                                        const optionIsCorrect = option.isCorrect;

                                        let classNameHighlight = 'highlightTextOption';

                                        if (isSelected && !optionIsCorrect) {
                                            classNameHighlight = 'highlightTextWrong';
                                        } else if (isSelected && optionIsCorrect) {
                                            classNameHighlight = 'highlightTextCorrect';
                                        } else if (!isSelected && optionIsCorrect) {
                                            classNameHighlight = 'highlightTextActive';
                                        }

                                        return (
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    marginRight: 50,
                                                    marginBottom: 30,
                                                }}
                                                key={ind.toString()}
                                            >
                                                <input
                                                    style={{
                                                        marginRight: 12,
                                                        backgroundColor: '#fff',
                                                    }}
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        return;
                                                    }}
                                                    disabled={true}
                                                />
                                                {
                                                    <div className={classNameHighlight}>
                                                        {ind + 1}. {option.option}
                                                    </div>
                                                }
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        ) : null}

                        {/* Inline Choice */}

                        {problem.questionType === 'inlineChoice' ? (
                            <View style={{ paddingTop: 20, paddingBottom: 30 }}>
                                {ReactHtmlParser(problem.inlineChoiceHtml, {
                                    transform: (node: any, ind1: any) => {
                                        if (node.type === 'tag' && node.name === 'p') {
                                            node.attribs.style =
                                                'line-height: 40px; font-family: Overpass; font-size: 16px;';

                                            const inlineChoiceOptions = problem.inlineChoiceOptions;

                                            return convertNodeToElement(node, ind1, (node: any, ind2: any) => {
                                                if (node.type === 'tag' && node.name === 'span') {
                                                    const options = inlineChoiceOptions[Number(node.attribs.id)];

                                                    let isCorrect = false;

                                                    inlineChoiceOptions[Number(node.attribs.id)].map(
                                                        (option: any, optionIndex: number) => {
                                                            if (
                                                                option.option ===
                                                                    solutions[index].inlineChoiceSelection[
                                                                        optionIndex
                                                                    ] &&
                                                                option.isCorrect
                                                            ) {
                                                                isCorrect = true;
                                                            }
                                                        }
                                                    );

                                                    return (
                                                        <span key={ind2.toString()} style={{ width: 160 }}>
                                                            <select
                                                                style={{
                                                                    border: `2px solid ${
                                                                        isCorrect ? '#35ac78' : '#f94144'
                                                                    }`,
                                                                    padding: 5,
                                                                    borderRadius: 2,
                                                                    fontFamily: 'Overpass',
                                                                    backgroundColor: '#fff',
                                                                }}
                                                                onChange={(e) => {
                                                                    return;
                                                                }}
                                                                disabled={true}
                                                                value={
                                                                    solutions[index].inlineChoiceSelection[
                                                                        Number(node.attribs.id)
                                                                    ]
                                                                }
                                                            >
                                                                <option value="" disabled hidden>
                                                                    No selection
                                                                </option>
                                                                {options.map((option: any, ind: number) => {
                                                                    return (
                                                                        <option
                                                                            key={ind.toString()}
                                                                            value={option.option}
                                                                            selected={option.isCorrect}
                                                                        >
                                                                            {option.option}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>
                                                        </span>
                                                    );
                                                }
                                            });
                                        } else {
                                            const inlineChoiceOptions = problem.inlineChoiceOptions;

                                            return convertNodeToElement(node, ind1, (node: any, ind2: any) => {
                                                if (node.type === 'tag' && node.name === 'span') {
                                                    const options = inlineChoiceOptions[Number(node.attribs.id)];

                                                    let isCorrect = false;

                                                    inlineChoiceOptions[Number(node.attribs.id)].map(
                                                        (option: any, optionIndex: number) => {
                                                            if (
                                                                option.option ===
                                                                    solutions[index].inlineChoiceSelection[
                                                                        optionIndex
                                                                    ] &&
                                                                option.isCorrect
                                                            ) {
                                                                isCorrect = true;
                                                            }
                                                        }
                                                    );

                                                    return (
                                                        <span key={ind2.toString()} style={{ width: 160 }}>
                                                            <select
                                                                style={{
                                                                    border: `2px solid ${
                                                                        isCorrect ? '#35ac78' : '#f94144'
                                                                    }`,
                                                                    padding: 5,
                                                                    borderRadius: 2,
                                                                    fontFamily: 'Overpass',
                                                                    backgroundColor: '#fff',
                                                                }}
                                                                onChange={(e) => {
                                                                    return;
                                                                }}
                                                                disabled={true}
                                                                value={
                                                                    solutions[index].inlineChoiceSelection[
                                                                        Number(node.attribs.id)
                                                                    ]
                                                                }
                                                            >
                                                                <option value="" disabled hidden>
                                                                    No selection
                                                                </option>
                                                                {options.map((option: any, ind: number) => {
                                                                    return (
                                                                        <option
                                                                            key={ind.toString()}
                                                                            value={option.option}
                                                                            selected={option.isCorrect}
                                                                        >
                                                                            {option.option}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>
                                                        </span>
                                                    );
                                                }
                                            });
                                        }
                                    },
                                })}
                            </View>
                        ) : null}

                        {problem.questionType === 'textEntry' ? (
                            <View style={{ paddingTop: 20, paddingBottom: 30 }}>
                                {ReactHtmlParser(problem.textEntryHtml, {
                                    transform: (node: any, ind1: any) => {
                                        if (node.type === 'tag' && node.name === 'p') {
                                            node.attribs.style =
                                                'line-height: 40px; font-family: Overpass; font-size: 16px;';

                                            const textEntryOptions = problem.textEntryOptions;

                                            return convertNodeToElement(node, ind1, (node: any, ind2: any) => {
                                                if (node.type === 'tag' && node.name === 'span') {
                                                    const option = textEntryOptions[Number(node.attribs.id)];

                                                    const type = option.type;

                                                    const value =
                                                        solutions[index].textEntrySelection[Number(node.attribs.id)];

                                                    let isCorrect =
                                                        value.toString().trim().toLowerCase() ===
                                                        option.option.toString().trim().toLowerCase();

                                                    return (
                                                        <input
                                                            style={{
                                                                border: `2px solid ${
                                                                    isCorrect ? '#35ac78' : '#f94144'
                                                                }`,
                                                                padding: 5,
                                                                borderRadius: 2,
                                                                fontFamily: 'Overpass',
                                                                backgroundColor: '#fff',
                                                            }}
                                                            onChange={(e) => {
                                                                return;
                                                            }}
                                                            disabled={true}
                                                            type={type}
                                                            value={value}
                                                        />
                                                    );
                                                }
                                            });
                                        } else {
                                            return convertNodeToElement(node, ind1, (node: any, ind2: any) => {
                                                if (node.type === 'tag' && node.name === 'span') {
                                                    const textEntryOptions = problem.textEntryOptions;

                                                    const option = textEntryOptions[Number(node.attribs.id)];

                                                    const type = option.type;
                                                    const value =
                                                        solutions[index].textEntrySelection[Number(node.attribs.id)];

                                                    let isCorrect = value === option.option;

                                                    return (
                                                        <input
                                                            style={{
                                                                border: `2px solid ${
                                                                    isCorrect ? '#35ac78' : '#f94144'
                                                                }`,
                                                                padding: 5,
                                                                borderRadius: 2,
                                                                fontFamily: 'Overpass',
                                                                backgroundColor: '#fff',
                                                            }}
                                                            onChange={(e) => {
                                                                return;
                                                            }}
                                                            disabled={true}
                                                            type={type}
                                                            value={value}
                                                        />
                                                    );
                                                }
                                            });
                                        }
                                    },
                                })}
                            </View>
                        ) : null}

                        {problem.questionType === 'multipart' ? (
                            <View
                                style={{
                                    flexDirection: 'column',
                                    // paddingLeft: Dimensions.get("window").width < 768 ? 0 : 40
                                }}
                            >
                                {problem.multipartOptions.map((part: any, partIndex: number) => {
                                    const alphabet = [
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

                                    return (
                                        <View
                                            style={{
                                                flexDirection: 'column',
                                            }}
                                            key={partIndex.toString()}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 22,
                                                    fontFamily: 'Overpass',
                                                    marginTop: 50,
                                                    marginBottom: 20,
                                                }}
                                            >
                                                Part {alphabet[partIndex]}
                                            </Text>

                                            <Text
                                                style={{
                                                    marginTop: 15,
                                                    fontSize: 16,
                                                    lineHeight: 25,
                                                    marginBottom: 20,
                                                }}
                                            >
                                                {parser(problem.multipartQuestions[partIndex])}
                                            </Text>

                                            {part.map((option: any, optionIndex: number) => {
                                                let selected =
                                                    solutions[index].multipartSelection[partIndex][optionIndex];
                                                let isCorrectAnswer = option.isCorrect;

                                                let color = '#000000';
                                                let background = '#f8f8f8';

                                                if (selected && isCorrectAnswer) {
                                                    color = '#35ac78';
                                                    background = '#d4f3e5';
                                                } else if (selected && !isCorrectAnswer) {
                                                    color = '#f94144';
                                                    background = '#ffe6f3';
                                                } else if (!selected && isCorrectAnswer) {
                                                    // color = '#000'
                                                    // background = '#e6f0ff';
                                                    color = '#35ac78';
                                                    background = '#d4f3e5';
                                                }

                                                return (
                                                    <View
                                                        style={{
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            marginBottom: 20,
                                                            marginTop: 20,
                                                        }}
                                                        key={optionIndex.toString()}
                                                    >
                                                        <input
                                                            style={{ marginRight: 25, backgroundColor: '#fff' }}
                                                            type="checkbox"
                                                            checked={
                                                                solutions[index].multipartSelection[partIndex][
                                                                    optionIndex
                                                                ]
                                                            }
                                                            onChange={(e) => {
                                                                return;
                                                            }}
                                                            disabled={true}
                                                        />

                                                        <Text
                                                            style={{
                                                                width:
                                                                    Dimensions.get('window').width < 768
                                                                        ? '80%'
                                                                        : '50%',
                                                                fontSize: 16,
                                                                paddingHorizontal: 15,
                                                                color,
                                                                lineHeight: 25,
                                                                backgroundColor:
                                                                    selected || isCorrectAnswer
                                                                        ? background
                                                                        : '#f8f8f8',
                                                                borderColor:
                                                                    selected || isCorrectAnswer ? color : 'none',
                                                                borderWidth: selected || isCorrectAnswer ? 1 : 0,
                                                                padding: 7,
                                                                borderRadius: 5,
                                                            }}
                                                        >
                                                            {parser(option.option)}
                                                        </Text>

                                                        {selected || isCorrectAnswer ? (
                                                            <Text
                                                                style={{
                                                                    fontSize: 16,
                                                                    fontFamily: 'Overpass',
                                                                    paddingLeft: 15,
                                                                    textTransform: 'uppercase',
                                                                }}
                                                            >
                                                                {selected && isCorrectAnswer
                                                                    ? 'Correct response'
                                                                    : selected && !isCorrectAnswer
                                                                    ? props.isOwner
                                                                        ? 'Student response'
                                                                        : 'Your response'
                                                                    : 'Missing Correct answer'}
                                                            </Text>
                                                        ) : null}
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    );
                                })}
                            </View>
                        ) : null}

                        {problem.questionType === 'equationEditor' ? (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                <View
                                    style={{
                                        backgroundColor: solutions[index].isEquationResponseCorrect
                                            ? '#d4f3e5'
                                            : '#ffe6f3',
                                        borderColor: solutions[index].isEquationResponseCorrect ? '#35ac78' : '#f94144',
                                        borderWidth: 1,
                                        borderRadius: 5,
                                        paddingHorizontal: 10,
                                        width: Dimensions.get('window').width < 768 ? '80%' : '50%',
                                    }}
                                >
                                    <MathJax
                                        math={'$$' + solutions[index].equationResponse + '$$'}
                                        style={{
                                            fontSize: 20,
                                        }}
                                    />
                                </View>
                                <Text style={{ fontSize: 16, fontFamily: 'Overpass', paddingLeft: 15 }}>
                                    {props.isOwner ? 'Student Response' : 'Your response'}
                                </Text>
                            </View>
                        ) : null}

                        {problem.questionType === 'equationEditor' && !solutions[index].isEquationResponseCorrect ? (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 40,
                                }}
                            >
                                <View
                                    style={{
                                        backgroundColor: '#d4f3e5',
                                        borderColor: '#35ac78',
                                        borderWidth: 1,
                                        borderRadius: 5,
                                        paddingHorizontal: 10,
                                        width: Dimensions.get('window').width < 768 ? '80%' : '50%',
                                    }}
                                >
                                    <MathJax
                                        math={'$$' + problem.correctEquations[0] + '$$'}
                                        style={{
                                            fontSize: 20,
                                        }}
                                    />
                                </View>
                                <Text style={{ fontSize: 16, fontFamily: 'Overpass', paddingLeft: 15 }}>
                                    Correct Answer
                                </Text>
                            </View>
                        ) : null}

                        {problem.questionType === 'matchTableGrid' ? (
                            <View
                                style={{
                                    flexDirection: 'column',
                                    marginTop: 20,
                                }}
                            >
                                {/* Header row */}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingLeft: 0,
                                    }}
                                >
                                    <View
                                        style={{
                                            width: '33%',
                                        }}
                                    />
                                    {problem.matchTableHeaders.map((header: any, headerIndex: number) => {
                                        return (
                                            <View
                                                style={{
                                                    width: '33%',
                                                    borderWidth: 1,
                                                    borderColor: '#DDD',
                                                    padding: 20,
                                                    height: '100%',
                                                    backgroundColor: '#fff',
                                                }}
                                                key={headerIndex.toString()}
                                            >
                                                <Text
                                                    style={{
                                                        fontFamily: 'overpass',
                                                        fontSize: 16,
                                                        textAlign: 'center',
                                                        width: '100%',
                                                    }}
                                                >
                                                    {header}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                                {/* Rows */}
                                {problem.matchTableChoices.map((choiceRow: any, rowIndex: number) => {
                                    return (
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                paddingLeft: 0,
                                            }}
                                            key={rowIndex.toString()}
                                        >
                                            <View
                                                style={{
                                                    width: '33%',
                                                    borderWidth: 1,
                                                    borderColor: '#ccc',
                                                    padding: 20,
                                                    height: '100%',
                                                    backgroundColor: '#fff',
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontFamily: 'overpass',
                                                        fontSize: 16,
                                                        textAlign: 'center',
                                                        width: '100%',
                                                    }}
                                                >
                                                    {problem.matchTableOptions[rowIndex]}
                                                </Text>
                                            </View>
                                            {choiceRow.map((choice: boolean, choiceIndex: number) => {
                                                let borderColor = '#ccc';
                                                let background = '#fff';

                                                const selected =
                                                    solutions[index].matchTableSelection[rowIndex][choiceIndex];

                                                if (choice) {
                                                    borderColor = '#35ac78';
                                                    background = '#d4f3e5';
                                                } else if (!choice && selected) {
                                                    borderColor = '#f94144';
                                                    background = '#ffe6f3';
                                                }

                                                return (
                                                    <View
                                                        style={{
                                                            width: '33%',
                                                            borderWidth: 1,
                                                            borderColor,
                                                            padding: 20,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            flexDirection: 'row',
                                                            justifyContent: 'center',
                                                            height: '100%',
                                                            backgroundColor: background,
                                                        }}
                                                        key={choiceIndex.toString()}
                                                    >
                                                        <TouchableOpacity
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                flexDirection: 'row',
                                                                justifyContent: 'center',
                                                            }}
                                                            disabled={true}
                                                        >
                                                            <RadioButton selected={selected} />
                                                        </TouchableOpacity>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    );
                                })}
                            </View>
                        ) : null}

                        {/* Remark */}

                        {!props.isOwner && problemComments[index] === '' ? null : (
                            <View
                                style={{
                                    width: window.screen.width < 1024 ? '100%' : '80%',
                                    maxWidth: 400,
                                    marginBottom: 40,
                                }}
                            >
                                {props.isOwner ? (
                                    <TextareaAutosize
                                        value={problemComments[index]}
                                        placeholder="Remark"
                                        minRows={3}
                                        style={{
                                            fontFamily: 'overpass',
                                            marginTop: 20,
                                            marginBottom: 20,
                                            fontSize: 16,
                                            padding: 10,
                                            width: '100%',
                                            maxWidth: '100%',
                                            border: '1px solid #cccccc',
                                            borderRadius: 2,
                                        }}
                                        onChange={(e: any) => {
                                            const updateProblemComments = [...problemComments];
                                            updateProblemComments[index] = e.target.value;
                                            setProblemComments(updateProblemComments);
                                        }}
                                    />
                                ) : (
                                    <View
                                        style={{ flexDirection: 'row', width: '100%', marginTop: 20, marginBottom: 40 }}
                                    >
                                        <Text style={{ color: '#000', fontSize: 14 }}>{problemComments[index]}</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                );
            })}
            {!props.isOwner && !comment ? null : (
                <View
                    style={{
                        width: '100%',
                        paddingVertical: 50,
                        paddingHorizontal: 0,
                        borderTopWidth: 1,
                        borderColor: '#ccc',
                    }}
                >
                    {!props.isOwner ? <Text style={{ width: '100%', textAlign: 'left' }}>Feedback</Text> : null}
                    {props.isOwner ? (
                        <View style={{ width: window.screen.width < 1024 ? '100%' : '80%', maxWidth: 400 }}>
                            <TextareaAutosize
                                style={{
                                    fontFamily: 'overpass',
                                    marginTop: 20,
                                    marginBottom: 20,
                                    fontSize: 16,
                                    padding: 10,
                                    borderRadius: 2,
                                    width: '100%',
                                    maxWidth: '100%',
                                    border: '1px solid #cccccc',
                                }}
                                value={comment}
                                onChange={(e: any) => setComment(e.target.value)}
                                minRows={3}
                                placeholder={'Overall Feedback'}
                            />
                        </View>
                    ) : (
                        <Text style={{ color: '#000', fontSize: 16, width: '100%', textAlign: 'left', marginTop: 40 }}>
                            {comment}
                        </Text>
                    )}
                </View>
            )}

            {/* Add Submit button here */}
            {props.isOwner ? (
                <View
                    style={{
                        flex: 1,
                        backgroundColor: '#f8f8f8',
                        alignItems: 'center',
                        display: 'flex',
                        marginTop: 25,
                        marginBottom: 25,
                        paddingBottom: 100,
                    }}
                >
                    {props.isOwner && props.currentQuizAttempt !== props.activeQuizAttempt ? (
                        <TouchableOpacity
                            onPress={() => props.modifyActiveQuizAttempt()}
                            style={{
                                backgroundColor: '#f8f8f8',
                                // borderRadius: 15,
                                // overflow: 'hidden',
                                // height: 35,
                                marginBottom: 20,
                            }}
                            disabled={props.user.email === disableEmailId}
                        >
                            <Text
                                style={{
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    borderColor: '#000',
                                    borderWidth: 1,
                                    color: '#000',
                                    backgroundColor: '#fff',
                                    fontSize: 11,
                                    paddingHorizontal: 24,
                                    fontFamily: 'inter',
                                    overflow: 'hidden',
                                    paddingVertical: 14,
                                    textTransform: 'uppercase',
                                    width: 150,
                                }}
                            >
                                MAKE ACTIVE
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                        onPress={() => props.onGradeQuiz(problemScores, problemComments, Number(percentage), comment)}
                        style={{
                            backgroundColor: '#f8f8f8',
                            // borderRadius: 15,
                            // overflow: 'hidden',
                            // height: 35,
                        }}
                        disabled={props.user.email === disableEmailId}
                    >
                        <Text
                            style={{
                                fontWeight: 'bold',
                                textAlign: 'center',
                                borderColor: '#000',
                                borderWidth: 1,
                                color: '#fff',
                                backgroundColor: '#000',
                                fontSize: 11,
                                paddingHorizontal: 24,
                                fontFamily: 'inter',
                                overflow: 'hidden',
                                paddingVertical: 14,
                                textTransform: 'uppercase',
                                width: 150,
                            }}
                        >
                            SAVE
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : null}
        </View>
    );
};

export default Quiz;

const styles = StyleSheet.create({
    input: {
        width: '50%',
        // borderBottomColor: '#f2f2f2',
        // borderBottomWidth: 1,
        fontSize: 16,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 5,
        marginBottom: 20,
    },
    row: {
        minHeight: 50,
        flexDirection: 'row',
        overflow: 'hidden',
        borderBottomColor: '#cccccc',
        borderBottomWidth: 1,
    },
    col: { width: '25%', justifyContent: 'center', display: 'flex', flexDirection: 'column', padding: 7 },
});
