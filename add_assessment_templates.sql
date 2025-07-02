-- PHQ-9 Depression Screening
INSERT INTO assessment_templates (id, name, version, questions, scoring_rules, interpretation_guidelines) VALUES (
'00000000-0000-0000-0000-000000000001', 
'PHQ-9 Depression Screening', 
'1.0', 
'{
    "title": "Over the last 2 weeks, how often have you been bothered by any of the following problems?",
    "items": [
        {"id": "q1", "text": "Little interest or pleasure in doing things"},
        {"id": "q2", "text": "Feeling down, depressed, or hopeless"},
        {"id": "q3", "text": "Trouble falling or staying asleep, or sleeping too much"},
        {"id": "q4", "text": "Feeling tired or having little energy"},
        {"id": "q5", "text": "Poor appetite or overeating"},
        {"id": "q6", "text": "Feeling bad about yourself — or that you are a failure or have let yourself or your family down"},
        {"id": "q7", "text": "Trouble concentrating on things, such as reading the newspaper or watching television"},
        {"id": "q8", "text": "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual"},
        {"id": "q9", "text": "Thoughts that you would be better off dead or of hurting yourself in some way"}
    ],
    "options": [
        {"value": 0, "text": "Not at all"},
        {"value": 1, "text": "Several days"},
        {"value": 2, "text": "More than half the days"},
        {"value": 3, "text": "Nearly every day"}
    ]
}', 
'{
    "type": "sum_of_scores",
    "questions": ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9"]
}', 
'{
    "score_ranges": [
        {"min": 0, "max": 4, "level": "None-minimal", "interpretation": "Your score suggests you are not currently experiencing significant depressive symptoms. Continue to monitor your mood."},
        {"min": 5, "max": 9, "level": "Mild", "interpretation": "Your score suggests you may be experiencing mild depression. Consider discussing these symptoms with a healthcare provider."},
        {"min": 10, "max": 14, "level": "Moderate", "interpretation": "Your score suggests moderate depression. It is advisable to seek professional help."},
        {"min": 15, "max": 19, "level": "Moderately Severe", "interpretation": "Your score indicates moderately severe depression. Professional help is strongly recommended."},
        {"min": 20, "max": 27, "level": "Severe", "interpretation": "Your score indicates severe depression. It is very important to seek professional help immediately."}
    ],
    "special_rules": [
        {
            "question_id": "q9", 
            "condition": {"operator": ">", "value": 0}, 
            "interpretation": "Answering anything other than ''Not at all'' to the question about self-harm suggests risk. Please contact a crisis line or a mental health professional immediately."
        }
    ]
}'
);

-- GAD-7 Anxiety Screening
INSERT INTO assessment_templates (id, name, version, questions, scoring_rules, interpretation_guidelines) VALUES (
'00000000-0000-0000-0000-000000000002', 
'GAD-7 Anxiety Screening', 
'1.0', 
'{
    "title": "Over the last 2 weeks, how often have you been bothered by the following problems?",
    "items": [
        {"id": "q1", "text": "Feeling nervous, anxious, or on edge"},
        {"id": "q2", "text": "Not being able to stop or control worrying"},
        {"id": "q3", "text": "Worrying too much about different things"},
        {"id": "q4", "text": "Trouble relaxing"},
        {"id": "q5", "text": "Being so restless that it''s hard to sit still"},
        {"id": "q6", "text": "Becoming easily annoyed or irritable"},
        {"id": "q7", "text": "Feeling afraid as if something awful might happen"}
    ],
    "options": [
        {"value": 0, "text": "Not at all"},
        {"value": 1, "text": "Several days"},
        {"value": 2, "text": "More than half the days"},
        {"value": 3, "text": "Nearly every day"}
    ]
}', 
'{
    "type": "sum_of_scores",
    "questions": ["q1", "q2", "q3", "q4", "q5", "q6", "q7"]
}', 
'{
    "score_ranges": [
        {"min": 0, "max": 4, "level": "Minimal", "interpretation": "Your score suggests minimal anxiety. No action required."},
        {"min": 5, "max": 9, "level": "Mild", "interpretation": "Your score suggests you may be experiencing mild anxiety. Monitoring is recommended."},
        {"min": 10, "max": 14, "level": "Moderate", "interpretation": "Your score suggests moderate anxiety. You may want to consider seeking professional help."},
        {"min": 15, "max": 21, "level": "Severe", "interpretation": "Your score indicates severe anxiety. Professional help is strongly recommended."}
    ]
}'
);

-- PSS-10 Stress Screening
INSERT INTO assessment_templates (id, name, version, questions, scoring_rules, interpretation_guidelines) VALUES (
'00000000-0000-0000-0000-000000000003', 
'PSS-10 Stress Screening', 
'1.0', 
'{
    "title": "In the last month, how often have you been...",
    "items": [
        {"id": "q1", "text": "upset because of something that happened unexpectedly?"},
        {"id": "q2", "text": "felt that you were unable to control the important things in your life?"},
        {"id": "q3", "text": "felt nervous and ''stressed''?"},
        {"id": "q4", "text": "felt confident about your ability to handle your personal problems?"},
        {"id": "q5", "text": "felt that things were going your way?"},
        {"id": "q6", "text": "found that you could not cope with all the things that you had to do?"},
        {"id": "q7", "text": "been able to control irritations in your life?"},
        {"id": "q8", "text": "felt that you were on top of things?"},
        {"id": "q9", "text": "been angered because of things that were outside of your control?"},
        {"id": "q10", "text": "felt difficulties were piling up so high that you could not overcome them?"}
    ],
    "options": [
        {"value": 0, "text": "Never"},
        {"value": 1, "text": "Almost Never"},
        {"value": 2, "text": "Sometimes"},
        {"value": 3, "text": "Fairly Often"},
        {"value": 4, "text": "Very Often"}
    ]
}', 
'{
    "type": "sum_of_scores_with_reverse",
    "questions": ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"],
    "reverse_scored_questions": ["q4", "q5", "q7", "q8"],
    "reverse_logic": {"0": 4, "1": 3, "2": 2, "3": 1, "4": 0}
}', 
'{
    "score_ranges": [
        {"min": 0, "max": 13, "level": "Low Stress", "interpretation": "Your stress level appears to be low."},
        {"min": 14, "max": 26, "level": "Moderate Stress", "interpretation": "You are experiencing a moderate level of stress. Consider exploring stress management techniques."},
        {"min": 27, "max": 40, "level": "High Stress", "interpretation": "Your stress level is high. It would be beneficial to seek support to manage your stress."}
    ]
}'
); 