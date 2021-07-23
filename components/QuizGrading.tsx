import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { TextInput as CustomTextInput } from './CustomTextInput'
import { Text, View } from './Themed';
import EquationEditor from 'equation-editor-react';


const Quiz: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [problems] = useState<any[]>(props.problems)
    const [solutions, setSolutions] = useState<any[]>(props.solutions.solutions)
    const [problemScores, setProblemScores] = useState<any[]>(props.solutions.problemScores)
    const [problemComments, setProblemComments] = useState<any[]>(props.solutions.problemComments ? props.solutions.problemComments : [])
    const [totalPossible, setTotalPossible] = useState(0);
    const [currentScore, setCurrentScore] = useState(0);
    const [percentage, setPercentage] = useState("");
    const [comment, setComment] = useState(props.comment ? props.comment : "");
    const [headers, setHeaders] = useState<any>(props.headers)

    useEffect(() => {

        setHeaders(props.headers);
        // setInstructions(props.instructions);

    }, [props.headers])

    
    useEffect(() => {
        let currentScore = 0;
        props.solutions.problemScores.forEach((score: any) => {
            currentScore += Number(score)
        })
        setCurrentScore(currentScore);

        if (props.solutions.solutions && !props.solutions.problemComments) {
            let comments: any[] = [];

            props.solutions.solutions.forEach((sol: any) => comments.push(""));

            setProblemComments(comments);

        }

    }, [props.solutions])

    useEffect(() => {
        let total = 0;
        props.problems.forEach((problem: any) => {
            total += problem.points;
        })
        setTotalPossible(total);
    }, [props.problems])

    useEffect(() => {
        let currentScore = 0;
        problemScores.forEach((score: any) => {
            currentScore += Number(score)
        })

        setCurrentScore(currentScore);

        if (totalPossible === 0) return;

        setPercentage(((currentScore/totalPossible)*100).toFixed(2))

    }, [problemScores, totalPossible])

    const renderHeader = (index: number) => {

        if (index in headers) {
            return (<Text style={{ width: '100%', marginBottom: 30, marginTop: 70, fontSize: 15, fontWeight: "600" }}>
                {headers[index]}
            </Text>)
        } 

        return null;
    }

    if (props.loading) return (<View
        style={{
            width: "100%",
            flex: 1,
            justifyContent: "center",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "white"
        }}>
        <ActivityIndicator color={"#a2a2aa"} />
    </View>)

    return (
        <View style={{
            width: '100%', backgroundColor: 'white',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            paddingTop: 15,
            flexDirection: 'column',
            justifyContent: 'flex-start'
        }}
        >
            <View style={{ width: '100%', flexDirection: 'row' }}>
                <Text style={{ width: '25%', fontSize: 15, color: "#202025", marginBottom: 10  }}>
                    {props.partiallyGraded ? "Finish Grading" : "" }
                </Text>
                <View style={{ width: '80%', flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10  }}>
                    <Text
                        style={{
                            fontSize: 12,
                            color: "white",
                            height: 22,
                            textAlign: 'right',
                            paddingHorizontal: 10,
                            marginLeft: 10,
                            borderRadius: 10,
                            backgroundColor: "#3B64F8",
                            lineHeight: 20,
                            paddingTop: 1
                        }}>
                        {percentage}%
                    </Text>
                    <Text
                        style={{
                            fontSize: 12,
                            color: "white",
                            height: 22,
                            textAlign: 'right',
                            paddingHorizontal: 10,
                            marginLeft: 10,
                            borderRadius: 10,
                            backgroundColor: "#3B64F8",
                            lineHeight: 20,
                            paddingTop: 1
                        }}>
                        {currentScore}/{totalPossible}
                    </Text>
                </View>
                
            </View>
            
            {
                props.problems.map((problem: any, index: any) => {

                    
                    let onlyOneCorrect = true;

                    if (!problem.questionType) {
                        let noOfCorrect = 0;

                        problem.options.map((option: any) => {
                            if (option.isCorrect) noOfCorrect++;    
                        })

                        if (noOfCorrect > 1) onlyOneCorrect = false;
                    }


                    return <View style={{ borderBottomColor: '#f4f4f6', borderBottomWidth: index === (props.problems.length - 1) ? 0 : 1, marginBottom: 25 }} key={index}>
                        {renderHeader(index)}
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ paddingTop: 15 }}>
                                <Text style={{ color: '#a2a2aa', fontSize: 15, paddingBottom: 25, marginRight: 10 }}>
                                    {index + 1}.
                                </Text>
                            </View>
                            {
                                problem.question && problem.question.includes("image:") ?
                                    (<Image
                                        resizeMode={'contain'}
                                        style={{
                                            width: 400,
                                            height: 400
                                        }}
                                        source={{
                                            uri: problem.question.split("image:")[1]
                                        }}
                                    />) :
                                    (
                                        problem.question && problem.question.includes("formula:") ? (
                                            <View style={{
                                                borderColor: '#f4f4f6',
                                                borderWidth: 1,
                                                borderRadius: 15,
                                                padding: 10,
                                                width: '50%'
                                            }}>
                                                <EquationEditor
                                                    value={problem.question.split("formula:")[1]}
                                                    onChange={() => { return; }}
                                                    autoCommands="pi theta sqrt sum prod alpha beta gamma rho int"
                                                    autoOperatorNames="sin cos tan arccos arcsin arctan"
                                                />
                                            </View>
                                        ) :
                                            <TextInput
                                                editable={false}
                                                value={problem.question}
                                                style={styles.input}
                                                placeholder={'Problem ' + (index + 1).toString()}
                                                placeholderTextColor={'#a2a2aa'}
                                            />
                                    )
                            }
                            {!props.isOwner ? null : <TextInput
                                editable={props.isOwner ? true : false}
                                value={problemScores[index]}
                                onChange={(e: any) => {
                                    if (Number.isNaN(Number(e.target.value))) return
                                    const updateProblemScores = [...problemScores]
                                    updateProblemScores[index] = e.target.value;
                                    setProblemScores(updateProblemScores)
                                }}
                                style={{
                                    width: '25%',
                                    borderBottomColor: '#f4f4f6',
                                    borderBottomWidth: 1,
                                    fontSize: 15,
                                    padding: 15,
                                    paddingTop: 12,
                                    paddingBottom: 12,
                                    marginTop: 5,
                                    marginBottom: 20
                                }}
                                placeholder={'Enter points'}
                                placeholderTextColor={'#a2a2aa'}
                            />}
                            {!props.isOwner ? null : <TextInput
                                editable={false}
                                value={"/ " + problem.points + " " + (Number(problem.points) === 1 ? 'Point' : ' Points')}
                                style={{
                                    width: '25%',
                                    fontSize: 15,
                                    padding: 15,
                                    paddingTop: 12,
                                    paddingBottom: 12,
                                    marginTop: 5,
                                    marginBottom: 20
                                }}
                                placeholder={'Enter points'}
                                placeholderTextColor={'#a2a2aa'}
                            />} 
                            {
                                !props.isOwner ? <Text style={{ fontSize: 15, width: '50%', marginTop: 5, marginBottom: 20, paddingTop: 12, paddingRight: 30, textAlign: 'right' }}>

                                    {Number(problemScores[index]).toFixed(1)} / {Number(problem.points).toFixed(1)}
                                </Text> : null
                            }
                        </View>

                        {
                            !problem.questionType && !onlyOneCorrect ? 
                                (<Text style={{ fontSize: 11, color: '#a2a2aa', marginBottom: 20, textAlign: 'right', paddingRight: 30 }}>
                                    more than one correct answer
                                </Text>)
                                : null
                        }
                        {
                            !problem.required ? 
                                (<Text style={{ fontSize: 11, color: '#a2a2aa', marginBottom: 20, textAlign: 'right', paddingRight: 30 }}>
                                    optional
                                </Text>)
                                : (<Text style={{ fontSize: 11, color: '#a2a2aa', marginBottom: 20, textAlign: 'right', paddingRight: 30  }}>
                                    required
                                    </Text>)
                        }

                        {
                            !problem.questionType && problem.options.map((option: any, i: any) => {

                                let color = '#202025'
                                if (option.isCorrect) {
                                    color = '#3B64F8'
                                } else if (!option.isCorrect && solutions[index].selected[i].isSelected)  {
                                    color = '#D91D56'
                                }


                                return <View style={{ flexDirection: 'row' }} key={solutions.toString() + i.toString()}>
                                    <View style={{ paddingTop: 15 }}>
                                        <input
                                            disabled={true}
                                            style={{ paddingRight: 20 }}
                                            type='checkbox'
                                            // value={props.isOwner ? String(option.isCorrect) : String(solutions[index].selected[i].isSelected)}
                                            checked={solutions[index].selected[i].isSelected}
                                            // onChange={(e) => {
                                            //     const updatedSolution = [...solutions]
                                            //     updatedSolution[index].selected[i].isSelected = !updatedSolution[index].selected[i].isSelected;
                                            //     setSolutions(updatedSolution)
                                            //     props.setSolutions(updatedSolution)
                                            // }}
                                        />
                                    </View>
                                    {
                                        option.option && option.option.includes("image:") ?
                                            (<Image
                                                resizeMode={'contain'}
                                                style={{
                                                    width: 200,
                                                    height: 200
                                                }}
                                                source={{
                                                    uri: option.option.split("image:")[1]
                                                }}
                                            />) :
                                            (
                                                option.option && option.option.includes("formula:") ?
                                                    <View style={{
                                                        borderColor: '#f4f4f6',
                                                        borderWidth: 1,
                                                        borderRadius: 15,
                                                        padding: 10,
                                                        width: '30%'
                                                    }}>
                                                        <EquationEditor
                                                            value={option.option.split("formula:")[1]}
                                                            onChange={() => { return; }}
                                                            autoCommands="pi theta sqrt sum prod alpha beta gamma rho int"
                                                            autoOperatorNames="sin cos tan arccos arcsin arctan"
                                                        />
                                                    </View> :
                                                    <TextInput
                                                        editable={false}
                                                        value={option.option}
                                                        style={{
                                                            width: '50%',
                                                            fontSize: 15,
                                                            padding: 15,
                                                            paddingTop: 12,
                                                            paddingBottom: 12,
                                                            marginTop: 5,
                                                            marginBottom: 20,
                                                            color
                                                        }}
                                                        placeholder={'Option ' + (i + 1).toString()}
                                                        placeholderTextColor={'#a2a2aa'}
                                                    />
                                            )
                                    }
                                </View>
                            })
                        }
                        {
                            problem.questionType === "freeResponse" ? 

                            <View style={{ width: '80%',  }}>
                                <CustomTextInput 
                                    editable={false}
                                    value={solutions[index].response}
                                    placeholder='Answer'
                                    hasMultipleLines={true}

                                />
                            
                            </View>
                            :
                            null
                        }

                        {!props.isOwner && problemComments[index] === '' ? null : <View style={{ width: '80%'}}>
                            {props.isOwner ? <CustomTextInput 
                                editable={props.isOwner ? true : false}
                                value={problemComments[index]}
                                placeholder='Instructor Remarks'
                                hasMultipleLines={true}
                                onChangeText={(val: any) => {
                                    const updateProblemComments = [...problemComments];
                                    updateProblemComments[index] = val;
                                    setProblemComments(updateProblemComments)
                                }}
                            /> : 
                            <View style={{ flexDirection: 'row', width: '100%', marginTop: 20, marginBottom: 40 }}> 
                                <Text style={{ color: '#a2a2aa',  fontSize: 13,   }}>
                                   Remark: {" "}
                                </Text>
                                <Text style={{ color: '#3b64f8',  fontSize: 13,  }}>
                                    {problemComments[index]}
                                </Text>
                            </View>}
                        </View>}
                    </View>
                })
            }

            {!props.isOwner && !comment ? null : <View style={{ width: '100%', alignItems: 'center', marginVertical: 50 }}>
                <Text style={{ width: '100%', textAlign: 'center'}}>
                    Overall Remarks
                </Text>
                {props.isOwner ?  <View style={{ width: '80%'}}>
                    <CustomTextInput 
                        editable={props.isOwner ? true : false}
                        value={comment}
                        onChangeText={(val: any) => setComment(val)}
                        hasMultipleLines={true}
                    /> 
                </View> :
                <Text style={{ color: '#3b64f8',  fontSize: 15, width: '100%', textAlign: 'center', marginTop: 40  }}>
                    {comment}
                </Text>
                }
            </View>}

            {/* Add Submit button here */}
            {props.isOwner ? <View
                style={{
                    flex: 1,
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    display: 'flex',
                    flexDirection: 'row',
                    marginTop: 25,
                    marginBottom: 25
                }}>
                <TouchableOpacity
                    onPress={() => props.onGradeQuiz(problemScores, problemComments, Number(percentage), comment)}
                    style={{
                        backgroundColor: 'white',
                        borderRadius: 15,
                        overflow: 'hidden',
                        height: 35,
                    }}>
                    <Text style={{
                        textAlign: 'center',
                        lineHeight: 35,
                        color: 'white',
                        fontSize: 12,
                        backgroundColor: '#3B64F8',
                        paddingHorizontal: 25,
                        fontFamily: 'inter',
                        height: 35,
                    }}>
                        SUBMIT 
                    </Text>
                </TouchableOpacity>
            </View> : null}
        </View >
    );
}

export default Quiz;

const styles = StyleSheet.create({
    input: {
        width: '50%',
        // borderBottomColor: '#f4f4f6',
        // borderBottomWidth: 1,
        fontSize: 15,
        padding: 15,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 5,
        marginBottom: 20
    }
});
