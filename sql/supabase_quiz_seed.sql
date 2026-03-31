insert into public.quiz_questions (quiz_key, question, options, correct_index, explanation, difficulty)
values
('itemization', 'You are marksman. Enemy has high burst and one assassin diving you every fight. Best item direction?', '["Wind of Nature or defensive timing item","Pure damage second item","Anti-heal first no matter what"]'::jsonb, 0, 'You need to survive first so your DPS can stay active.', 'normal'),
('itemization', 'Enemy has heavy sustain in long fights. Which item theme is highest priority?', '["Anti-heal items","Only penetration stack","Crit greed scaling"]'::jsonb, 0, 'Anti-heal increases effective damage for the whole team.', 'normal'),
('itemization', 'Enemy front line is tanky and fights are front-to-back. Most consistent approach?', '["Sustained DPS with pen/on-hit","All-in burst build","Always dive backline"]'::jsonb, 0, 'Sustained damage wins extended tank fights.', 'normal');
