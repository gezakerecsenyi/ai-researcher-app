import React, { useCallback, useState } from 'react';

interface Doc {
    title: string;
    text: string;
    id: string;
}

function App() {
    const [title, setTitle] = useState('');
    const [term, setTerm] = useState('');
    const [docs, setDocs] = useState<Doc[]>([]);
    const [reportCount, setReportCount] = useState(1);

    const handleDocChange = useCallback((docId: string, key: keyof Doc) => {
        return (ev: { target: { value: string } }) => setDocs(
            docs.map(e => e.id === docId ?
                {
                    ...e,
                    [key]: ev.target.value,
                } :
                e),
        );
    }, [docs]);

    const handleTitleChange = useCallback((ev: { target: { value: string } }) => {
        setTitle(ev.target.value);
    }, []);

    const handleTermChange = useCallback((ev: { target: { value: string } }) => {
        setTerm(ev.target.value);
    }, []);

    const handleReportCountChange = useCallback((ev: { target: { valueAsNumber: number } }) => {
        setReportCount(ev.target.valueAsNumber);
    }, []);

    const deleteDoc = useCallback((id: string) => {
        return () => {
            setDocs(docs.filter(e => e.id !== id));
        };
    }, [docs]);

    const addNewDoc = useCallback(() => {
        setDocs([
            ...docs,
            {
                title: '',
                text: '',
                id: Math.random().toString(),
            },
        ]);
    }, [docs]);

    const [response, setResponse] = useState<string[] | null>(null);
    const [selectedTab, setSelectedTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [warning, setWarning] = useState(false);
    const [error, setError] = useState(false);
    const generate = useCallback(
        () => {
            setLoading(true);
            setError(false);
            setWarning(false);
            fetch(`http://nickthompson.a2hosted.com/query?count=${reportCount}&title=${
            // fetch(`http://localhost:3200/query?count=${reportCount}&title=${
                encodeURIComponent(title)
            }&term=${
                encodeURIComponent(term)
            }`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    docs: docs.map(e => encodeURIComponent(JSON.stringify(e))).join(','),
                }),
            })
                .then(e => {
                    if (e.status !== 200) {
                        throw new TypeError();
                    }

                    return e;
                })
                .then(e => e.json() as Promise<{ res: string[] }>)
                .then(e => {
                    setLoading(false);
                    setResponse(e.res);
                    setSelectedTab(0);
                    setError(false);

                    if (!e.res.length) {
                        setWarning(true);
                    }
                })
                .catch(() => {
                    setResponse(null);
                    setError(true);
                    setWarning(false);
                    setLoading(false);
                });
        },
        [
            title,
            docs,
            term,
            reportCount,
        ],
    );

    return (
        <div className='App'>
            {
                loading && (
                    <>
                        <h2>Loading...</h2>
                        <p>
                            Please be patient! It may take some time for the system to calculate, especially if you've
                            requested many reports. </p>
                    </>
                )
            }

            {
                warning && (
                    <>
                        <h2>Warning!</h2>
                        <p>
                            The server has finished... but returned no reports. This is usually caused by the researcher
                            program reaching its internally-configured GPT-4 request limit, that's been programmed in to
                            prevent it getting stuck in infinite loops. This can be modified in the code if an increase
                            is necessary, but it is often easier to amend your prompt and docs to be clearer and easier
                            to search. </p>
                    </>
                )
            }

            {
                error && (
                    <>
                        <h2>Uh-oh... something went wrong.</h2>
                        <p>
                            The server returned an error code, indicating it finished early without being able to
                            compute some or all of your requested reports. This is most likely an indication of an issue
                            with some internal misconfiguration, ill-set or expired API keys, or external API limits
                            having been reached. </p>
                    </>
                )
            }

            <h2>
                Title </h2>
            <p>
                The title of the report - choose this so as to be unambiguous to the AI, rather than necessarily how
                it may be formatted for a human. </p>
            <input
                className='title'
                value={title}
                onChange={handleTitleChange}
                disabled={loading}
                placeholder='Enter the report title...'
            />

            <h2>
                Suggested initial search </h2>
            <p>
                Sometimes, it helps to give the AI a bit of a prompt... offer a search term that you would use when
                beginning research into a project like this. </p>
            <input
                className='title'
                value={term}
                onChange={handleTermChange}
                disabled={loading}
                placeholder='Enter a useful first search term...'
            />

            <h2>
                Documents to reference </h2>
            <p>
                In addition to the internet, you may provide documents for the AI research assistant to query. </p>
            <div className='docs'>
                {
                    docs.map(doc => (
                        <div
                            className='doc-entry'
                            key={doc.id}
                        >
                            <input
                                className='doc-title'
                                value={doc.title}
                                onChange={handleDocChange(doc.id, 'title')}
                                placeholder='Document title'
                                disabled={loading}
                            />
                            <textarea
                                className='doc-text'
                                value={doc.text}
                                onChange={handleDocChange(doc.id, 'text')}
                                placeholder='Document text'
                                disabled={loading}
                            />
                            <button
                                className='delete'
                                onClick={deleteDoc(doc.id)}
                                disabled={loading}
                            >-
                            </button>
                        </div>
                    ))
                }

                <button
                    className='add'
                    onClick={addNewDoc}
                    disabled={loading}
                >+ Add new document
                </button>
            </div>

            <h2>
                Generate </h2>
            <p>
                Use this button to begin the generation process. This may take a few minutes as the AI churns through
                the research. If the buttons and options become un-disabled but no results appeared, this is an
                indication of an internal fault. </p>

            <label className='report-count'>
                Report count ({reportCount}) - use this to choose how many reports you wish to generate. Increasing this
                number substantially may increase API costs and loading time dramatically.
            </label>
            <input
                type='range'
                value={reportCount}
                disabled={loading}
                onChange={handleReportCountChange}
                min={1}
                max={5}
            />

            <button
                className='generate'
                onClick={generate}
                disabled={loading}
            >
                Generate...
            </button>
            {
                response && (
                    <div className='responses'>
                        <h2>
                            Responses </h2>
                        <p>
                            These are all of the responses returned by the AI. These may have undergone slightly different
                            research paths, decided to end researching and begin writing at different points, or otherwise
                            differ in writing style and word choice. Choose your preferred option! </p>

                        <div className='tab-switcher'>
                            {
                                new Array(response.length).fill(0).map((_, i) => (
                                    <button
                                        className={'tab-select' + (selectedTab === i ? ' active' : '')}
                                        onClick={() => setSelectedTab(i)}
                                    >
                                        {i + 1}
                                    </button>
                                ))
                            }
                        </div>
                        <div className='content'>
                            {
                                response[selectedTab].split('\n').map(e => (<p>{e}</p>))
                            }
                        </div>
                    </div>
                )
            }
        </div>
    );
}

export default App;
