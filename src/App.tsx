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
    const generate = useCallback(
        () => {
            setLoading(true);
            fetch(`http://localhost:3200/query?count=${reportCount}&title=${
                encodeURIComponent(title)
            }&docs=${
                docs.map(e => encodeURIComponent(encodeURIComponent(JSON.stringify(e)))).join(',')
            }&term=${
                encodeURIComponent(term)
            }`)
                .then(e => e.json() as Promise<{ res: string[] }>)
                .then(e => {
                    setLoading(false);
                    setResponse(e.res);
                    setSelectedTab(0);

                    console.log('got res');
                })
                .catch(() => {
                    setResponse(null);
                    setLoading(false);
                });
        },
        [
            title,
            docs,
            term,
            reportCount
        ],
    );

    return (
        <div className='App'>
            <h2>
                Title
            </h2>
            <p>
                The title of the report - choose this so as to be unambiguous to the AI, rather than necessarily how
                it may be formatted for a human.
            </p>
            <input
                className='title'
                value={title}
                onChange={handleTitleChange}
                disabled={loading}
                placeholder='Enter the report title...'
            />

            <h2>
                Suggested initial search
            </h2>
            <p>
                Sometimes, it helps to give the AI a bit of a prompt... offer a search term that you would use when
                beginning research into a project like this.
            </p>
            <input
                className='title'
                value={term}
                onChange={handleTermChange}
                disabled={loading}
                placeholder='Enter a useful first search term...'
            />

            <h2>
                Documents to reference
            </h2>
            <p>
                In addition to the internet, you may provide documents for the AI research assistant to query.
            </p>
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
                Generate
            </h2>
            <p>
                Use this button to begin the generation process. This may take a few minutes as the AI churns through
                the research. If the buttons and options become un-disabled but no results appeared, this is an
                indication of an internal fault.
            </p>

            <label className='report-count'>
                Report count ({reportCount}) - use this to choose how many reports you wish to generate. Increasing this
                number substantially may increase API costs and loading time dramatically.
            </label>
            <input
                type='range'
                value={reportCount}
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
                            Responses
                        </h2>
                        <p>
                            These are all of the responses returned by the AI. These may have undergone slightly different
                            research paths, decided to end researching and begin writing at different points, or otherwise
                            differ in writing style and word choice. Choose your preferred option!
                        </p>

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
