-- public.logging_cdc definition

-- Drop table

-- DROP TABLE public.logging_cdc;

CREATE TABLE public.logging_cdc (
	replayid varchar NOT NULL,
	channelname varchar NULL,
	commitnumber varchar NULL,
	entityname varchar NULL,
	changetype varchar NULL,
	transactionkey varchar NULL,
	committimestamp varchar NULL,
	payload varchar NULL,
	numofrecords int4 NULL
);
CREATE UNIQUE INDEX logging_cdc_replayid_idx ON public.logging_cdc USING btree (replayid);