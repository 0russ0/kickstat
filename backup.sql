--
-- PostgreSQL database dump
--

\restrict 2HpNopgBUruMoTo25gcUtEtdk6YlEcvRgsib90LInjScd8n0rDAifFQJ9ulFYFs

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: athletes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.athletes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.athletes OWNER TO postgres;

--
-- Name: games; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.games (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    season_id uuid NOT NULL,
    athlete_id uuid NOT NULL,
    opponent text,
    date text NOT NULL,
    home_away text NOT NULL,
    surface text NOT NULL,
    weather jsonb,
    is_playoff boolean DEFAULT false NOT NULL,
    my_score integer,
    opponent_score integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.games OWNER TO postgres;

--
-- Name: kicks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kicks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    athlete_id uuid NOT NULL,
    kick_type text NOT NULL,
    data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    game_id uuid,
    is_game_winner boolean DEFAULT false NOT NULL,
    practice_session_id uuid
);


ALTER TABLE public.kicks OWNER TO postgres;

--
-- Name: practice_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.practice_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    athlete_id uuid NOT NULL,
    date text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.practice_sessions OWNER TO postgres;

--
-- Name: seasons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seasons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    athlete_id uuid NOT NULL,
    name text NOT NULL,
    year integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.seasons OWNER TO postgres;

--
-- Data for Name: athletes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.athletes (id, name, created_at) FROM stdin;
e678a921-360f-4183-bfd9-8f3a92691593	Rainer	2026-05-10 12:49:07.470452+00
b94dd99f-75e9-4409-8628-320f505d55fd	Rivers	2026-05-10 13:25:27.961966+00
\.


--
-- Data for Name: games; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.games (id, season_id, athlete_id, opponent, date, home_away, surface, weather, is_playoff, my_score, opponent_score, created_at) FROM stdin;
ad65f2d6-3ab0-48f8-87dc-065cdb591ae2	15238f8a-df00-4701-bceb-8208d5ade295	b94dd99f-75e9-4409-8628-320f505d55fd	USC	2026-10-23	away	turf	{"windDir": null, "windMph": 3, "conditions": "cloudy"}	t	\N	\N	2026-05-10 14:22:04.894141+00
39b9e957-2698-44b8-8bad-c2ad9cb81dc9	15238f8a-df00-4701-bceb-8208d5ade295	b94dd99f-75e9-4409-8628-320f505d55fd	MtLebo	2026-05-08	home	grass	{"windDir": null, "windMph": 2, "conditions": "rain"}	f	\N	\N	2026-05-10 19:42:37.583989+00
4842b453-5b29-4a4e-b106-93baf98989a2	ba68a70d-d03f-44a3-9827-c3df58d60b43	e678a921-360f-4183-bfd9-8f3a92691593	Game 1	2025-10-11	home	turf	{"windDir": null, "windMph": null, "conditions": "clear"}	f	\N	\N	2026-05-10 20:41:45.830615+00
bc792a54-d442-4ec6-aa74-99cd77eadf1a	ba68a70d-d03f-44a3-9827-c3df58d60b43	e678a921-360f-4183-bfd9-8f3a92691593	Game 2	2025-11-12	away	grass	{"windDir": null, "windMph": null, "conditions": "cloudy"}	f	\N	\N	2026-05-10 20:42:07.420283+00
62f3eb38-47c0-4a14-bf3c-374e3d1958cd	ba68a70d-d03f-44a3-9827-c3df58d60b43	e678a921-360f-4183-bfd9-8f3a92691593	Game 3	2025-10-23	home	grass	{"windDir": null, "windMph": null, "conditions": "cloudy"}	f	\N	\N	2026-05-10 20:42:31.308385+00
\.


--
-- Data for Name: kicks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kicks (id, athlete_id, kick_type, data, created_at, game_id, is_game_winner, practice_session_id) FROM stdin;
683d475c-06af-42ed-87bb-470df6f61ea7	b94dd99f-75e9-4409-8628-320f505d55fd	field_goal	{"los": 25, "outcome": "made", "missType": null, "totalDistance": 42}	2026-05-10 14:22:47.797825+00	ad65f2d6-3ab0-48f8-87dc-065cdb591ae2	t	\N
38233f99-7dac-4c93-aabe-54e62090bd30	b94dd99f-75e9-4409-8628-320f505d55fd	field_goal	{"los": 37, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 54}	2026-05-10 14:39:53.01145+00	ad65f2d6-3ab0-48f8-87dc-065cdb591ae2	t	\N
2c2e297d-3507-4f76-82d1-784b11310c7d	b94dd99f-75e9-4409-8628-320f505d55fd	field_goal	{"los": 36, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 53}	2026-05-10 19:42:56.634272+00	39b9e957-2698-44b8-8bad-c2ad9cb81dc9	f	\N
d76ae041-40e6-4717-8989-ed3666442899	b94dd99f-75e9-4409-8628-320f505d55fd	field_goal	{"los": 30, "badSnap": false, "outcome": "missed", "missType": "blocked", "totalDistance": 47}	2026-05-10 19:43:05.693525+00	39b9e957-2698-44b8-8bad-c2ad9cb81dc9	f	\N
a6c4138a-b5be-409d-9e61-74d7ff403794	b94dd99f-75e9-4409-8628-320f505d55fd	field_goal	{"los": 25, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 42}	2026-05-10 19:43:11.483745+00	39b9e957-2698-44b8-8bad-c2ad9cb81dc9	f	\N
7d78a0cb-cec7-49c2-8648-032f750c02e7	b94dd99f-75e9-4409-8628-320f505d55fd	field_goal	{"los": 52, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 69}	2026-05-10 19:43:22.730435+00	39b9e957-2698-44b8-8bad-c2ad9cb81dc9	t	\N
01fa1f9b-d4c1-42f1-bc1d-1a8ac7208704	e678a921-360f-4183-bfd9-8f3a92691593	pat	{"outcome": "made"}	2026-05-11 15:32:50.148072+00	4842b453-5b29-4a4e-b106-93baf98989a2	f	\N
d58edf3c-fcb0-423c-8155-62fea59d1db5	e678a921-360f-4183-bfd9-8f3a92691593	pat	{"outcome": "made"}	2026-05-11 15:33:06.988123+00	62f3eb38-47c0-4a14-bf3c-374e3d1958cd	f	\N
315d8f46-e205-484e-afbd-db551698ffc0	e678a921-360f-4183-bfd9-8f3a92691593	pat	{"outcome": "made"}	2026-05-11 15:36:09.538121+00	bc792a54-d442-4ec6-aa74-99cd77eadf1a	f	\N
b093b2bb-64cc-42aa-bd9c-de641c8767c4	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 13, "badSnap": false, "outcome": "missed", "missType": "left", "totalDistance": 30}	2026-05-15 19:58:14.331592+00	\N	f	\N
c3b9c7c6-c32c-40c2-95a3-7511ef8d1e99	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 13, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 30}	2026-05-15 19:58:31.534889+00	\N	f	\N
d6387035-c294-4d19-bd38-7cc685f1c329	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 13, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 30}	2026-05-15 19:58:36.963649+00	\N	f	\N
5640e3d1-7804-4b76-9ca7-25fb78df7f8d	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 13, "badSnap": false, "outcome": "missed", "missType": "left", "totalDistance": 30}	2026-05-15 19:58:42.798215+00	\N	f	\N
5a7f3c7c-25b9-4198-80a9-603f80d2d1e6	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 18, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 35}	2026-05-15 19:59:08.95716+00	\N	f	\N
585e48ed-267c-4e9d-a679-ed2b424f30fa	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 18, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 35}	2026-05-15 19:59:36.083738+00	\N	f	\N
8b5ae563-32b4-4c21-a377-316891142be4	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 18, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 35}	2026-05-15 20:00:27.903606+00	\N	f	\N
b0d5d098-54a4-46bc-87ab-b6d2c90e036c	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 18, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 35}	2026-05-15 20:01:31.590222+00	\N	f	\N
bb486a36-fae8-42db-9108-829f2dd46fcc	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 18, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 35}	2026-05-15 20:02:18.267766+00	\N	f	\N
788bade4-914e-427a-9272-265d14df9715	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 23, "badSnap": false, "outcome": "missed", "missType": "right", "totalDistance": 40}	2026-05-15 20:03:04.442554+00	\N	f	\N
e2bc14ea-8757-42f0-beea-cb28ab95feb4	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 23, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 40}	2026-05-15 20:03:55.918897+00	\N	f	\N
2472a2cd-256b-471e-a551-59e9c5c0d062	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 23, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 40}	2026-05-15 20:04:14.200262+00	\N	f	\N
9d7a568b-f9ed-4d08-ac3e-f06c6b6efad7	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 23, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 40}	2026-05-15 20:05:16.090816+00	\N	f	\N
a6c59e47-4f13-4fa3-99d5-136e9462c708	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 23, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 40}	2026-05-15 20:05:58.232172+00	\N	f	\N
f0e8b65f-bdbd-48fd-9936-8a14d89e2d26	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 28, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 45}	2026-05-15 20:07:06.210511+00	\N	f	\N
e06170fc-68b8-4868-afac-310ab57c5da9	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 22, "badSnap": false, "outcome": "missed", "missType": "blocked", "totalDistance": 39}	2026-05-15 20:10:28.561718+00	\N	f	\N
db26a2b4-09de-41ac-9d8a-046cb6dcab5e	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 23, "badSnap": false, "outcome": "missed", "missType": "right", "totalDistance": 40}	2026-05-15 20:10:46.46553+00	\N	f	\N
29049aa9-52ef-420a-ba73-53d26741fb5e	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 23, "badSnap": false, "outcome": "missed", "missType": "short", "totalDistance": 40}	2026-05-15 20:11:20.050754+00	\N	f	\N
2371abc3-ff3f-4eab-a3a0-e48bd196ebd4	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 23, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 40}	2026-05-15 20:12:25.205598+00	\N	f	\N
07434ff9-f9ad-4824-9cb3-e0ecbadbe4c7	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 23, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 40}	2026-05-15 20:13:42.267774+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
b8170869-9f1b-42e4-ad35-45b4fbf04154	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 31, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 48}	2026-05-15 20:07:51.884677+00	\N	f	\N
c51aa583-bf90-47da-88c5-e77b154dc454	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 23, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 40}	2026-05-15 20:13:53.157667+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
e3f2af80-ed2e-4634-ae81-4c53f750576c	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 23, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 40}	2026-05-15 20:16:19.060402+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
1c1af97c-9aaa-4618-b47e-69a1f9d89919	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 23, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 40}	2026-05-15 20:16:24.588962+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
e1dfff5d-782c-41b0-b824-b297d8422be8	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 28, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 45}	2026-05-15 20:16:33.923131+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
d914165f-4d2c-4753-a410-3d5344be2fae	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 31, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 48}	2026-05-15 20:16:37.496797+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
d73d1206-e1a1-400a-9820-7841aa37f14a	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 22, "badSnap": false, "outcome": "missed", "missType": "blocked", "totalDistance": 39}	2026-05-15 20:17:24.769276+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
ba0e1604-dba6-4a97-8a95-3089988a8532	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 23, "badSnap": false, "outcome": "missed", "missType": "right", "totalDistance": 40}	2026-05-15 20:17:36.42275+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
39be6648-a5dd-4666-849f-aa8a15d20969	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 23, "badSnap": false, "outcome": "missed", "missType": "short", "totalDistance": 40}	2026-05-15 20:17:51.177151+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
17cd2b37-f727-4099-b9dc-96e166a6fa98	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 28, "badSnap": false, "outcome": "missed", "missType": "short", "totalDistance": 45}	2026-05-15 20:18:25.074096+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
10930f33-432a-4c39-a3a6-ee9f3bfe38c2	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 28, "badSnap": false, "outcome": "missed", "missType": "short", "totalDistance": 45}	2026-05-15 20:18:41.523929+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
0a63a9f6-5a9a-4802-a5f5-1cd16c1f5769	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 28, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 45}	2026-05-15 20:18:52.467829+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
5a3509c1-6d03-4db4-a410-567f4eb45434	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 28, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 45}	2026-05-15 20:20:02.023818+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
5918841e-f2c8-4d83-bb0d-bec864801729	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 28, "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 45}	2026-05-15 20:20:29.912625+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
f6ad7af5-ceb9-485d-8240-1e652379a7bf	e678a921-360f-4183-bfd9-8f3a92691593	punt	{"obSide": null, "obYard": null, "result": null, "badSnap": false, "distance": 36, "hangtime": 3763.6538339853287, "snapSide": "own", "snapYard": 34, "landingSide": "opponent", "landingYard": 30, "returnYards": null}	2026-05-15 20:22:32.128347+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
37ff506f-a612-485c-bcc7-cf3c81110668	e678a921-360f-4183-bfd9-8f3a92691593	punt	{"obSide": null, "obYard": null, "result": null, "badSnap": false, "distance": 40, "hangtime": 3797.435917019844, "snapSide": "own", "snapYard": 34, "landingSide": "opponent", "landingYard": 26, "returnYards": null}	2026-05-15 20:23:22.80579+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
bd15f552-e193-4361-9abd-bbca2e40bd1e	e678a921-360f-4183-bfd9-8f3a92691593	punt	{"obSide": null, "obYard": null, "result": null, "badSnap": false, "distance": 42, "hangtime": 3318.0991669893265, "snapSide": "own", "snapYard": 25, "landingSide": "opponent", "landingYard": 33, "returnYards": null}	2026-05-15 20:24:43.750237+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
c5e066e8-15f0-4df0-aec6-38c4b23086ac	e678a921-360f-4183-bfd9-8f3a92691593	punt	{"obSide": null, "obYard": null, "result": null, "badSnap": false, "distance": 31, "hangtime": 3293.156875014305, "snapSide": "own", "snapYard": 35, "landingSide": "opponent", "landingYard": 34, "returnYards": null}	2026-05-15 20:26:08.511733+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
2583ece5-9f55-43e6-8b6c-5ecfebe2e5f0	e678a921-360f-4183-bfd9-8f3a92691593	punt	{"obSide": null, "obYard": null, "result": null, "badSnap": false, "distance": 34, "hangtime": 3880.210250020027, "snapSide": "own", "snapYard": 30, "landingSide": "opponent", "landingYard": 36, "returnYards": null}	2026-05-15 20:28:30.107832+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
3487baff-877c-46c6-8623-d381476beda2	e678a921-360f-4183-bfd9-8f3a92691593	punt	{"obSide": null, "obYard": null, "result": null, "badSnap": false, "distance": 34, "hangtime": 3977.814749956131, "snapSide": "own", "snapYard": 30, "landingSide": "opponent", "landingYard": 36, "returnYards": null}	2026-05-15 20:29:00.705118+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
7de054ee-1646-4c7f-ae4b-a22c6cdba0f9	e678a921-360f-4183-bfd9-8f3a92691593	punt	{"obSide": null, "obYard": null, "result": null, "badSnap": false, "distance": 31, "hangtime": 4058.5116670131683, "snapSide": "own", "snapYard": 30, "landingSide": "opponent", "landingYard": 39, "returnYards": null}	2026-05-15 20:30:25.200028+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
07861b2e-ef89-42b3-b7b2-3d5f34569014	e678a921-360f-4183-bfd9-8f3a92691593	punt	{"obSide": null, "obYard": null, "result": null, "badSnap": false, "distance": 31, "hangtime": 3012.733458042145, "snapSide": "own", "snapYard": 30, "landingSide": "opponent", "landingYard": 39, "returnYards": null}	2026-05-15 20:30:55.625313+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
80730022-5ca4-4e20-af93-c6f9a0b9d6e1	e678a921-360f-4183-bfd9-8f3a92691593	punt	{"obSide": null, "obYard": null, "result": null, "badSnap": false, "distance": 34, "hangtime": 3626.57837498188, "snapSide": "own", "snapYard": 30, "landingSide": "opponent", "landingYard": 36, "returnYards": null}	2026-05-15 20:32:08.599195+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
bb6079cb-dd2c-4b10-8493-202178847f76	e678a921-360f-4183-bfd9-8f3a92691593	punt	{"obSide": null, "obYard": null, "result": null, "badSnap": false, "distance": 37, "hangtime": 4261.606750011444, "snapSide": "own", "snapYard": 30, "landingSide": "opponent", "landingYard": 33, "returnYards": null}	2026-05-15 20:32:36.595031+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
598e8737-0869-4336-aeea-db6254601171	e678a921-360f-4183-bfd9-8f3a92691593	punt	{"obSide": null, "obYard": null, "result": null, "badSnap": false, "distance": 44, "hangtime": 4077.611207962036, "snapSide": "own", "snapYard": 30, "landingSide": "opponent", "landingYard": 26, "returnYards": null}	2026-05-15 20:34:00.861006+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
3fb44d11-f141-4ae9-bbf9-45f477c6a3d2	e678a921-360f-4183-bfd9-8f3a92691593	punt	{"obSide": null, "obYard": null, "result": null, "badSnap": false, "distance": 36, "hangtime": 2891.9922500252724, "snapSide": "own", "snapYard": 30, "landingSide": "opponent", "landingYard": 34, "returnYards": null}	2026-05-15 20:34:23.588598+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
079ab318-48b0-429c-903c-08ee9beb3815	e678a921-360f-4183-bfd9-8f3a92691593	punt	{"obSide": null, "obYard": null, "result": null, "badSnap": false, "distance": 34, "hangtime": 3732.079667031765, "snapSide": "own", "snapYard": 30, "landingSide": "opponent", "landingYard": 36, "returnYards": null}	2026-05-15 20:35:28.266249+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
a1e82a07-7961-49de-a255-ab971a0d8b0c	e678a921-360f-4183-bfd9-8f3a92691593	punt	{"obSide": null, "obYard": null, "result": null, "badSnap": false, "distance": 33, "hangtime": 3288.100500047207, "snapSide": "own", "snapYard": 30, "landingSide": "opponent", "landingYard": 37, "returnYards": null}	2026-05-15 20:36:19.44893+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
8f7c9f20-c1de-4c39-ba0a-7459d1831f54	e678a921-360f-4183-bfd9-8f3a92691593	punt	{"obSide": null, "obYard": null, "result": null, "badSnap": false, "distance": 28, "hangtime": 4055.629042029381, "snapSide": "own", "snapYard": 30, "landingSide": "opponent", "landingYard": 42, "returnYards": null}	2026-05-15 20:38:25.246422+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
90c75ade-b26a-4d42-9a3f-d3a404d08a71	e678a921-360f-4183-bfd9-8f3a92691593	punt	{"obSide": null, "obYard": null, "result": null, "badSnap": false, "distance": 38, "hangtime": 3861.6980000138283, "snapSide": "own", "snapYard": 30, "landingSide": "opponent", "landingYard": 32, "returnYards": null}	2026-05-15 20:39:32.005808+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
17c2701c-4eb6-42b5-8678-7944f7359467	e678a921-360f-4183-bfd9-8f3a92691593	punt	{"obSide": null, "obYard": null, "result": null, "badSnap": false, "distance": 32, "hangtime": 3762.000625014305, "snapSide": "own", "snapYard": 30, "landingSide": "opponent", "landingYard": 38, "returnYards": null}	2026-05-15 20:40:01.59691+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
d73f8c43-b96c-4848-99e1-46f49825e351	e678a921-360f-4183-bfd9-8f3a92691593	punt	{"obSide": null, "obYard": null, "result": null, "badSnap": false, "distance": 36, "hangtime": 3445.0163339972496, "snapSide": "own", "snapYard": 30, "landingSide": "opponent", "landingYard": 34, "returnYards": null}	2026-05-15 20:40:50.453301+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
32004440-d137-4881-b4cd-dfb07a72bc4c	e678a921-360f-4183-bfd9-8f3a92691593	punt	{"obSide": null, "obYard": null, "result": null, "badSnap": false, "distance": 29, "hangtime": 3395.092999994755, "snapSide": "own", "snapYard": 34, "landingSide": "opponent", "landingYard": 37, "returnYards": null}	2026-05-15 20:41:16.45577+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
d08878b6-ed00-4476-988f-111764d1bda4	e678a921-360f-4183-bfd9-8f3a92691593	punt	{"obSide": null, "obYard": null, "result": null, "badSnap": false, "distance": 36, "hangtime": 3482.0128749608994, "snapSide": "own", "snapYard": 30, "landingSide": "opponent", "landingYard": 34, "returnYards": null}	2026-05-15 20:42:07.542554+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
2aa5f6d0-9a8c-4a9e-a48f-8afbffd98877	e678a921-360f-4183-bfd9-8f3a92691593	punt	{"obSide": null, "obYard": null, "result": null, "badSnap": false, "distance": 35, "hangtime": 4053.827583014965, "snapSide": "own", "snapYard": 30, "landingSide": "opponent", "landingYard": 35, "returnYards": null}	2026-05-15 20:42:33.450835+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
572d2289-35a3-43a8-8db7-c8608694123d	e678a921-360f-4183-bfd9-8f3a92691593	kickoff	{"hangtime": 3244.1992089748383, "touchback": false, "landingYard": 9, "outOfBounds": null, "returnYards": null, "touchbackType": null}	2026-05-15 20:44:40.631808+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
597bc538-02a9-402d-980a-8543e8261ca3	e678a921-360f-4183-bfd9-8f3a92691593	kickoff	{"hangtime": 3246.3469170331955, "touchback": false, "landingYard": 2, "outOfBounds": null, "returnYards": null, "touchbackType": null}	2026-05-15 20:46:18.692087+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
088ccd7b-b7cf-4454-94b8-4f4a2b4ae067	e678a921-360f-4183-bfd9-8f3a92691593	kickoff	{"hangtime": 3106.3182910084724, "touchback": false, "landingYard": 6, "outOfBounds": null, "returnYards": null, "touchbackType": null}	2026-05-15 20:47:21.698998+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
071a8edc-9105-48b7-a559-8e599ebb78d6	e678a921-360f-4183-bfd9-8f3a92691593	kickoff	{"hangtime": 3263.8604170084, "touchback": false, "landingYard": 12, "outOfBounds": null, "returnYards": null, "touchbackType": null}	2026-05-15 20:50:50.121783+00	\N	f	dcef9196-89f0-4a56-845f-74cb653fbb3d
113a33bf-787b-4386-90de-e36a1e41048b	b94dd99f-75e9-4409-8628-320f505d55fd	field_goal	{"los": 25, "hash": "left", "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 42}	2026-05-23 12:20:45.348232+00	\N	f	\N
92155eed-a5ae-46c9-9267-963c7dcce736	b94dd99f-75e9-4409-8628-320f505d55fd	punt	{"obSide": null, "obYard": null, "result": null, "badSnap": false, "distance": 47, "hangtime": 2860.3738338947296, "snapSide": "opponent", "snapYard": 49, "landingSide": "opponent", "landingYard": 2, "returnYards": null}	2026-05-23 12:21:52.548953+00	\N	f	\N
8805554f-98bd-4bd1-9d6d-7adbc3a92b3a	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 18, "hash": "right", "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 35}	2026-05-25 14:01:32.02459+00	\N	f	a5181223-3d71-4b2a-b262-77f45ee958fa
b8d9f60f-7221-43d5-8631-42363f92d8ea	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 18, "hash": "left", "badSnap": false, "outcome": "missed", "missType": "left", "totalDistance": 35}	2026-05-25 14:02:42.453573+00	\N	f	a5181223-3d71-4b2a-b262-77f45ee958fa
ca0fff8c-0ab9-4c30-a035-e8730cee8077	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 18, "hash": "center", "badSnap": false, "outcome": "missed", "missType": "left", "totalDistance": 35}	2026-05-25 14:06:00.402794+00	\N	f	a5181223-3d71-4b2a-b262-77f45ee958fa
ee15cf3c-421c-4bb1-ad64-436bf5dbe178	e678a921-360f-4183-bfd9-8f3a92691593	field_goal	{"los": 18, "hash": "right", "badSnap": false, "outcome": "made", "missType": null, "totalDistance": 35}	2026-05-25 14:06:43.892035+00	\N	f	a5181223-3d71-4b2a-b262-77f45ee958fa
\.


--
-- Data for Name: practice_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.practice_sessions (id, athlete_id, date, notes, created_at) FROM stdin;
07c9e35d-9671-4ea2-a523-b8bcf2cdbe19	b94dd99f-75e9-4409-8628-320f505d55fd	2026-05-10	\N	2026-05-10 15:08:24.849028+00
dcef9196-89f0-4a56-845f-74cb653fbb3d	e678a921-360f-4183-bfd9-8f3a92691593	2026-05-15	\N	2026-05-15 19:44:53.095617+00
e37d3e41-f316-476c-a4e3-164b7fe2e59d	b94dd99f-75e9-4409-8628-320f505d55fd	2026-05-16	\N	2026-05-16 12:22:42.46148+00
a5181223-3d71-4b2a-b262-77f45ee958fa	e678a921-360f-4183-bfd9-8f3a92691593	2026-05-25	\N	2026-05-25 14:01:23.109545+00
\.


--
-- Data for Name: seasons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.seasons (id, athlete_id, name, year, created_at) FROM stdin;
15238f8a-df00-4701-bceb-8208d5ade295	b94dd99f-75e9-4409-8628-320f505d55fd	2025-26 freshman	2026	2026-05-10 14:20:16.860168+00
ba68a70d-d03f-44a3-9827-c3df58d60b43	e678a921-360f-4183-bfd9-8f3a92691593	Rainer freshman	2026	2026-05-10 20:39:48.784324+00
\.


--
-- Name: athletes athletes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.athletes
    ADD CONSTRAINT athletes_pkey PRIMARY KEY (id);


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- Name: kicks kicks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kicks
    ADD CONSTRAINT kicks_pkey PRIMARY KEY (id);


--
-- Name: practice_sessions practice_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.practice_sessions
    ADD CONSTRAINT practice_sessions_pkey PRIMARY KEY (id);


--
-- Name: seasons seasons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seasons
    ADD CONSTRAINT seasons_pkey PRIMARY KEY (id);


--
-- Name: games games_athlete_id_athletes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_athlete_id_athletes_id_fk FOREIGN KEY (athlete_id) REFERENCES public.athletes(id) ON DELETE CASCADE;


--
-- Name: games games_season_id_seasons_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_season_id_seasons_id_fk FOREIGN KEY (season_id) REFERENCES public.seasons(id) ON DELETE CASCADE;


--
-- Name: kicks kicks_athlete_id_athletes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kicks
    ADD CONSTRAINT kicks_athlete_id_athletes_id_fk FOREIGN KEY (athlete_id) REFERENCES public.athletes(id) ON DELETE CASCADE;


--
-- Name: kicks kicks_game_id_games_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kicks
    ADD CONSTRAINT kicks_game_id_games_id_fk FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE SET NULL;


--
-- Name: kicks kicks_practice_session_id_practice_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kicks
    ADD CONSTRAINT kicks_practice_session_id_practice_sessions_id_fk FOREIGN KEY (practice_session_id) REFERENCES public.practice_sessions(id) ON DELETE SET NULL;


--
-- Name: practice_sessions practice_sessions_athlete_id_athletes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.practice_sessions
    ADD CONSTRAINT practice_sessions_athlete_id_athletes_id_fk FOREIGN KEY (athlete_id) REFERENCES public.athletes(id) ON DELETE CASCADE;


--
-- Name: seasons seasons_athlete_id_athletes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seasons
    ADD CONSTRAINT seasons_athlete_id_athletes_id_fk FOREIGN KEY (athlete_id) REFERENCES public.athletes(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 2HpNopgBUruMoTo25gcUtEtdk6YlEcvRgsib90LInjScd8n0rDAifFQJ9ulFYFs

