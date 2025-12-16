import axios from "axios";

const getLatestVersion = async (packageName) => {
    try {

        const { data } = await axios.get(
            `https://registry.npmjs.org/${packageName}/latest`
        );

        const version = {
            name: packageName,
            version: data.version,
            hasTypes: !!data.types || !!data.typings,
        };
        return version;
    } catch (error) {
        if (error.status === 404) return;
        console.error(error);
        throw error;
    }
};

export { getLatestVersion };