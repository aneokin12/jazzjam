import { Pinecone } from "@pinecone-database/pinecone";
import { AttributeInfo } from "langchain/schema/query_constructor";
import { OpenAIEmbeddings, OpenAI } from "@langchain/openai";
import { SelfQueryRetriever } from "langchain/retrievers/self_query";
import { PineconeTranslator } from "@langchain/pinecone"
import { PineconeStore } from "@langchain/pinecone";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableConfig, RunnableWithMessageHistory } from "@langchain/core/runnables";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { formatDocumentsAsString } from "langchain/util/document";
import { ChatOpenAI } from '@langchain/openai';
import { LangChainAdapter, StreamingTextResponse } from 'ai';
import { ChatMessageHistory } from "langchain/stores/message/in_memory"

/**
 * We define the attributes we want to be able to query on.
 * in this case, we want to be able to query on the name, experience, known songs, and instruments of the musician.
 * We also provide a description of each attribute and the type of the attribute.
 * This is used to generate the query prompts.
 */
const attributeInfo: AttributeInfo[] = [
    {
        name: 'name',
        description: 'The name of the musician',
        type: 'string',
    },
    {
        name: 'experience',
        description: 'The experience level of the musician',
        type: 'string',
    },
    {
        name: 'songs',
        description: 'The list of songs the musician can play',
        type: 'list[string]',
    },
    {
        name: 'instruments',
        description: 'The instruments the musician knows',
        type: 'string or list[string]',
    },
    {
        name: 'location',
        description: 'The location of the musician',
        type: 'string',
    },
];

/**
 * Next, we instantiate a vector store. This is where we store the embeddings of the documents.
 * We also need to provide an embeddings object. This is used to embed the documents.
 */
if (
  !process.env.PINECONE_API_KEY ||
  !process.env.PINECONE_ENVIRONMENT ||
  !process.env.PINECONE_INDEX
) {
  throw new Error(
    "PINECONE_ENVIRONMENT and PINECONE_API_KEY and PINECONE_INDEX must be set"
  );
}

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.Index(process.env.PINECONE_INDEX);

const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small"
});
const llm = new OpenAI();
const documentContents = "Profile of a jazz musician.";
const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
  pineconeIndex: index,
});
const selfQueryRetriever = SelfQueryRetriever.fromLLM({
  llm,
  vectorStore,
  documentContents,
  attributeInfo,
  /**
   * We need to create a basic translator that translates the queries into a
   * filter format that the vector store can understand. We provide a basic translator
   * translator here, but you can create your own translator by extending BaseTranslator
   * abstract class. Note that the vector store needs to support filtering on the metadata
   * attributes you want to query on.
   */
  structuredQueryTranslator: new PineconeTranslator(),
});

const qaSystemPrompt = `You are an assistant designed to retrieve information about jazz musicians from a database. Your name is Charlie.
You are capable of answering all types of questions, but you typically deal with database queries.
You can retrieve context from the database to answer questions. When you receive context, always output the context and answer the question. 
Use the following pieces of retrieved context to answer the question.
If you don't know the answer, just say that you don't know, and make sure to state your purpose as an assistant. Help the user out when you can by telling them what you are capable, and offering suggestions of what they might look up.
Always type in lowercase, using slang as if you are GenZ.
Use three sentences maximum and keep the answer concise.

{context}`;

const qaPrompt = ChatPromptTemplate.fromMessages([
  ["system", qaSystemPrompt],
  ["human", "{input}"],
]);

const ragChain = RunnableSequence.from([
  {
    context: selfQueryRetriever.pipe(formatDocumentsAsString),
    input: new RunnablePassthrough(),
  },
  qaPrompt,
  llm,
  new StringOutputParser(),
]);


export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const stream = await ragChain.stream({
    input: prompt.toString(),
    chat_history: [],
  });

  const aiStream = LangChainAdapter.toAIStream(stream);

  return new StreamingTextResponse(aiStream);
}
