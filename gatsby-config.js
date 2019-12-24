module.exports = {
  siteMetadata: {
    title: `seonghyeon.dev`,
    name: `seonghyeon.dev`,
    siteUrl: `https://seonghyeon.dev`,
    description: `Seonghyeon Kim's blog`,
    hero: {
      // heading: `<p style="font-size: 20px;color: #7A8085;">~/seonghyeon.dev</p><div style="display: inline-flex;">><input style="border: none; background: transparent;" placeholder="_"></input></div>`,
      heading: `<a href="https://github.com/NovemberOscar"> <img id="github-heatmap" src="https://ghchart.rshah.org/NovemberOscar" alt="GitHub contribution heatmap"> </a>`,
      maxWidth: 600,
    },
    social: [
      {
        name: `twitter`,
        url: `https://twitter.com/NovemberOscar_`,
      },
      {
        name: `github`,
        url: `https://github.com/NovemberOscar`,
      },
      {
        name: `linkedin`,
        url: `https://www.linkedin.com/in/novemberoscar/`,
      },
    ],
  },
  plugins: [
    'gatsby-plugin-sitemap',
    {
      resolve: "@narative/gatsby-theme-novela",
      options: {
        contentPosts: "content/posts",
        contentAuthors: "content/authors",
        basePath: "/",
        authorsPage: false,
        sources: {
          local: true,
          // contentful: true,
        },
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Novela by Narative`,
        short_name: `Novela`,
        start_url: `/`,
        background_color: `#fff`,
        theme_color: `#fff`,
        display: `standalone`,
        icon: `src/assets/favicon.png`,
      },
    },
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        trackingId: 'UA-143368612-1',
        // Puts tracking script in the head instead of the body
        head: true,
        // IP anonymization for GDPR compliance
        anonymize: true,
        // Disable analytics for users with `Do Not Track` enabled
        respectDNT: true,
        // Avoids sending pageview hits from custom paths
        exclude: ['/preview/**'],
        // Specifies what percentage of users should be tracked
        sampleRate: 100,
        // Determines how often site speed tracking beacons will be sent
        siteSpeedSampleRate: 10,
      },
    },
  ],
};
