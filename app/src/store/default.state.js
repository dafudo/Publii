export default {
    // Application front-end status
    app: {
        config: {},
        customConfig: {},
        notification: false,
        versionInfo: {
            number: 0,
            build: 0,
            status: ''
        },
        editorOpened: false
    },
    // Persistent components
    components: {
        sidebar: {
            status: false,
        }
    },
    // Data about installed themes and their location
    themes: [],
    themesPath: '',
    dirs: {},
    // Data about available sites
    sites: [],
    // Data about currently displayed site
    currentSite: {
        config: {},
        posts: [],
        tags: [],
        postsTags: [],
        postsAuthors: [],
        postTemplates: [],
        themes: [],
        images: [],
        menuStructure: [],
        themeSettings: [],
        siteDir: ''
    }
};
