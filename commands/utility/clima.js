const { SlashCommandBuilder, EmbedBuilder } = require('discord.js'); 
const axios = require('axios'); // Importamos axios para hacer solicitudes HTTP

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clima') // Nombre del comando
        .setDescription('Obtener la información actual del clima.') // Descripción 
        .addStringOption(option =>
            option.setName('ciudad') // Opción para que el usuario ingrese una ciudad
                .setDescription('Ciudad para obtener el clima') // Descripción de la opción
                .setRequired(true)), // Esta opción es obligatoria

    async execute(interaction) {
        // Almacenamos el nombre de la ciudad proporcionada por el usuario
        const city = interaction.options.getString('ciudad');

        // Obtenemos la API key de OpenWeatherMap del archivo .env
        const apiKey = process.env.OPENWEATHERMAP_API_KEY;

        // Creamos la URL de la API usando el nombre de la ciudad y la API key
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

        try {
            // Hacemos una solicitud GET a la API del clima usando axios
            const response = await axios.get(url);
            const weather = response.data; // Obtenemos los datos del clima de la respuesta

            // Obtenemos los datos específicos del clima
            const temp = weather.main.temp; // Temperatura actual
            const description = weather.weather[0].description; // Descripción del clima
            const icon = weather.weather[0].icon; // Icono del clima

            // Obtenemos un emoji adecuado dependiendo de la descripción del clima
            const emoji = getWeatherEmoji(description);

            // Comprobamos si hay información de lluvia (volumen en la última hora, si está disponible)
            const rain = weather.rain ? weather.rain['1h'] : 0; // Volumen de lluvia en la última hora

            // Creamos un embed para enviar la información del clima de manera formateada
            const embed = new EmbedBuilder()
                .setColor('#1E90FF') // Color del embed
                .setTitle(`Clima en ${city}`) // Título que muestra la ciudad
                .setDescription(`${emoji} ${description.charAt(0).toUpperCase() + description.slice(1)}`) // Descripción del clima
                .addFields(
                    { name: 'Temperatura', value: `${temp}°C`, inline: true }, // Campo de la temperatura actual
                    { name: 'Sensación térmica', value: `${weather.main.feels_like}°C`, inline: true }, // Sensación térmica
                    { name: 'Humedad', value: `${weather.main.humidity}%`, inline: true }, // Humedad
                    { name: 'Posibilidad de lluvia (Última hora)', value: `${rain > 0 ? `${rain} mm` : 'Sin lluvia'}`, inline: true } // Información sobre la lluvia
                )
                .setThumbnail(`http://openweathermap.org/img/wn/${icon}.png`) // Icono del clima
                .setTimestamp() // Fecha y hora actual
                .setFooter({ text: 'Información del clima proporcionada por OpenWeatherMap' }); // Pie de página con la fuente de la información

            // Respondemos a la interacción sin un tiempo límite de respuesta
            await interaction.deferReply(); // Deferrir la respuesta para indicar que se está procesando
            await interaction.editReply({ embeds: [embed] }); // Editar la respuesta una vez que se ha procesado la información
        } catch (error) {
            // Si ocurre un error (por ejemplo, si la ciudad no es válida o hay un problema con la API), lo manejamos aquí
            console.error(error); // Imprimimos el error en la consola
            await interaction.reply({ content: 'No se pudo obtener la información del clima. Inténtalo de nuevo más tarde.', ephemeral: true }); // Envia un mensaje de error al usuario
        }
    },
};

// Función que devuelve un emoji basado en la descripción del clima
function getWeatherEmoji(description) {
    if (description.includes('clear')) return '☀️'; // Despejado
    if (description.includes('cloud')) return '☁️'; // Nublado
    if (description.includes('rain')) return '🌧️'; // Lluvia
    if (description.includes('snow')) return '❄️'; // Nieve
    if (description.includes('thunderstorm')) return '⛈️'; // Tormenta
    if (description.includes('fog')) return '🌫️'; // Niebla
    return '🌈'; // Emoji por defecto si no coincide con ninguna descripción
}
