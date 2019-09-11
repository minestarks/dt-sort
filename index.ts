import axios from 'axios';

const authToken = process.env['GITHUB_PAT'];

const url = "https://api.github.com/graphql";

async function query(query: string) {
    try {
        const response = await axios.post(url, { query }, { headers: { Authorization: "Bearer " + authToken } });
        const data = response.data;
        //console.log(JSON.stringify(data, null, 2));
        const project = data.data.repository.projects.edges[0].node;
        console.log(`project: ${project.name} ${project.url}`);
        const column = project.columns.edges[0].node;

        sortAndPrintColumn(column);

    } catch (error) {
        console.log(error);
    }
};

query(`
    query {
        repository(owner:"DefinitelyTyped", name:"DefinitelyTyped") {
        projects(first: 1, search:"Pull Request Status Board") {
            edges {
            node {
                name
                url
                columns(first:1) {
                    edges {
                    node {
                        name
                        cards {
                            totalCount
                            edges {
                            node {
                                content {
                                    ... on PullRequest {
                                        title
                                        url
                                        additions
                                        deletions
                                        labels(first:5) {
                                            edges {
                                            node {
                                                name
                                            }
                                            }
                                        }
                                    }
                                }
                            }
                            }
                        }
                    }
                    }
                }
            }
            }
        }
        }
    }
    `
);

function sortAndPrintColumn(column: any) {
    console.log(`column: ${column.name} (${column.cards.totalCount})`);
    console.log();
    const prs: {
        title: string;
        url: string;
        additions: number;
        deletions: number;
        labels: {
            edges: {
                node: {
                    name: string;
                };
            }[];
        };
    }[] = column.cards.edges.map((e: any) => e.node.content);
    prs.sort(sortPrs);
    prs.forEach(pr => {
        console.log(pr.title);
        console.log(pr.url);
        console.log(`${pr.additions} additions, ${pr.deletions} deletions`);
        pr.labels.edges.filter(e => e.node.name === 'Popular package').map(e => `**${e.node.name}**`).forEach(f => console.log(f));
        console.log();
    });
}

function sortPrs(a: { title: string; url: string; additions: number; deletions: number; labels: { edges: { node: { name: string; }; }[]; }; }, b: { title: string; url: string; additions: number; deletions: number; labels: { edges: { node: { name: string; }; }[]; }; }): number{
    const aIsPopular = a.labels.edges.some(ale => ale.node.name === 'Popular package');
    const bIsPopular = b.labels.edges.some(ale => ale.node.name === 'Popular package');
    if (aIsPopular !== bIsPopular) {
        return aIsPopular ? 1 : -1;
    }
    else {
        return (a.additions + a.deletions) - (b.additions + b.deletions);
    }
}

