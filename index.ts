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
        console.log(`column: ${column.name} (${column.cards.totalCount})`);
        const prs: {title: string, url: string, additions: number, deletions: number}[] = column.cards.edges.map((e: any) => e.node.content);
        prs.sort((a,b) => (b.additions + b.deletions) - (a.additions + a.deletions));
        prs.forEach(pr => {
            console.log(pr.title);
            console.log(pr.url);
            console.log(`${pr.additions} additions, ${pr.deletions} deletions`);
            console.log();
        })
        //console.log(prs.map(pr => JSON.stringify(pr)).join('\n'));
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

