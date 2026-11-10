import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UserRole } from '../users/enums/user-role.enum';
import { ProductReviewStatus } from './schemas/product-review.schema';
import { ReviewsService } from './reviews.service';

type ReviewServiceDependencies = ConstructorParameters<typeof ReviewsService>;

function buildReview(productId: string, suffix: number) {
  return {
    id: `review-${suffix}`,
    userName: `Cliente ${suffix}`,
    productId,
    productName: 'Lavanda',
    productSlug: 'lavanda',
    productImage: '/lavanda.png',
    orderId: `order-${suffix}`,
    orderReference: `ORD-${suffix}`,
    rating: suffix === 1 ? 5 : 4,
    comment: `Comentario ${suffix}`,
    status: ProductReviewStatus.PUBLISHED,
    createdAt: new Date(`2026-06-0${suffix}T12:00:00.000Z`),
  };
}

describe('ReviewsService pagination', () => {
  let service: ReviewsService;
  let productReviewModel: {
    find: jest.Mock;
    countDocuments: jest.Mock;
    aggregate: jest.Mock;
  };
  let findQuery: {
    sort: jest.Mock;
    skip: jest.Mock;
    limit: jest.Mock;
    exec: jest.Mock;
  };

  beforeEach(() => {
    findQuery = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    productReviewModel = {
      find: jest.fn().mockReturnValue(findQuery),
      countDocuments: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(38),
      }),
      aggregate: jest.fn().mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue([{ _id: null, averageRating: 4.289 }]),
      }),
    };

    service = new ReviewsService(
      productReviewModel as unknown as ReviewServiceDependencies[0],
      {} as ReviewServiceDependencies[1],
      {} as ReviewServiceDependencies[2],
      {} as ReviewServiceDependencies[3],
      {} as ReviewServiceDependencies[4],
    );
  });

  it('devuelve metadatos y el bloque solicitado sin alterar el promedio global', async () => {
    const productId = new Types.ObjectId().toString();
    findQuery.exec.mockResolvedValue([
      buildReview(productId, 1),
      buildReview(productId, 2),
    ]);

    const response = await service.listProductReviews(productId, {
      page: 3,
      limit: 4,
    });

    expect(productReviewModel.find).toHaveBeenCalledWith({
      productId,
      status: ProductReviewStatus.PUBLISHED,
    });
    expect(findQuery.sort).toHaveBeenCalledWith({
      createdAt: -1,
      _id: -1,
    });
    expect(findQuery.skip).toHaveBeenCalledWith(8);
    expect(findQuery.limit).toHaveBeenCalledWith(4);
    expect(response).toEqual(
      expect.objectContaining({
        total: 38,
        page: 3,
        limit: 4,
        totalPages: 10,
        averageRating: 4.3,
      }),
    );
    expect(response.items).toHaveLength(2);
    expect(response.items[0]).not.toHaveProperty('orderId');
    expect(response.items[0]).not.toHaveProperty('orderReference');
    expect(response.items[0]).not.toHaveProperty('productId');
    expect(response.items[0]).not.toHaveProperty('status');
  });

  it('aplica límites seguros incluso si se invoca el servicio directamente', async () => {
    const productId = new Types.ObjectId().toString();
    findQuery.exec.mockResolvedValue([]);

    const response = await service.listProductReviews(productId, {
      page: 0,
      limit: 100,
    });

    expect(findQuery.skip).toHaveBeenCalledWith(0);
    expect(findQuery.limit).toHaveBeenCalledWith(20);
    expect(response.page).toBe(1);
    expect(response.limit).toBe(20);
  });

  it.each([
    ['Ana María López', 'privado@example.com', 'Ana'],
    ['  María-José  García ', 'privado@example.com', 'María-José'],
    ['ANA', 'ana@example.com', 'Cliente INHALEX'],
    ['nombre.apellido', 'nombre.apellido@example.com', 'Cliente INHALEX'],
    ['privado@example.com', 'privado@example.com', 'Cliente INHALEX'],
    ['Ana privado@example.com', 'privado@example.com', 'Cliente INHALEX'],
    ['', 'privado@example.com', 'Cliente INHALEX'],
    [undefined, 'privado@example.com', 'Cliente INHALEX'],
    ['Cliente INHALEX', 'privado@example.com', 'Cliente INHALEX'],
  ])(
    'protege el autor de una reseña antigua (%s) al publicarla en la consulta',
    async (userName, userEmail, expectedName) => {
      const productId = new Types.ObjectId().toString();
      const storedReview = {
        ...buildReview(productId, 1),
        userId: 'private-user-id',
        userName,
        userEmail,
      };
      findQuery.exec.mockResolvedValue([storedReview]);

      const response = await service.listProductReviews(productId);

      expect(response.items[0]).toEqual({
        id: storedReview.id,
        userName: expectedName,
        rating: storedReview.rating,
        comment: storedReview.comment,
        createdAt: storedReview.createdAt.toISOString(),
      });
      expect(storedReview.userName).toBe(userName);
    },
  );

  it('rechaza identificadores de producto inválidos', async () => {
    await expect(
      service.listProductReviews('producto-invalido', { page: 1, limit: 8 }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(productReviewModel.find).not.toHaveBeenCalled();
  });
});

describe('ReviewsService public author on creation', () => {
  it.each([
    [{ firstName: 'Lucía', name: 'Nombre completo privado' }, 'Lucía'],
    [{ name: 'Ana María López' }, 'Ana'],
    [{ name: 'persona' }, 'Cliente INHALEX'],
    [{ name: 'persona@example.com' }, 'Cliente INHALEX'],
    [{ name: '   ' }, 'Cliente INHALEX'],
    [null, 'Cliente INHALEX'],
  ])(
    'guarda solo el nombre público seguro (%j)',
    async (storedUser, expected) => {
      const productId = new Types.ObjectId().toString();
      const query = (value: unknown) => ({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(value),
      });
      const reviewModel = {
        findOne: jest.fn().mockReturnValue(query(null)),
        create: jest.fn((data: Record<string, unknown>) =>
          Promise.resolve({ ...data, id: 'created-review' }),
        ),
        aggregate: jest.fn().mockResolvedValue([]),
      };
      const orderModel = {
        findOne: jest.fn().mockReturnValue(
          query({
            id: 'completed-order',
            reference: 'ORD-PRIVATE',
            items: [
              {
                productId,
                productName: 'Lavanda',
                productSlug: 'lavanda',
                image: '/lavanda.png',
              },
            ],
          }),
        ),
      };
      const service = new ReviewsService(
        reviewModel as unknown as ReviewServiceDependencies[0],
        orderModel as unknown as ReviewServiceDependencies[1],
        {} as ReviewServiceDependencies[2],
        {
          findById: jest.fn().mockResolvedValue(storedUser),
        } as unknown as ReviewServiceDependencies[3],
        {
          createForUser: jest.fn().mockResolvedValue(undefined),
        } as unknown as ReviewServiceDependencies[4],
      );

      const response = await service.createReview(
        {
          sub: 'private-user',
          email: 'persona@example.com',
          role: UserRole.USER,
        },
        { productId, rating: 5, comment: 'Buen producto.' },
      );

      expect(reviewModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userName: expected,
          userId: 'private-user',
          userEmail: 'persona@example.com',
          orderReference: 'ORD-PRIVATE',
        }),
      );
      expect(response.userName).toBe(expected);
    },
  );
});
